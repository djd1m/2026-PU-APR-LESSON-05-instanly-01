import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';

interface AmoCrmTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class AmoCrmService {
  private readonly logger = new Logger(AmoCrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  getOAuthUrl(domain: string, userId: string): string {
    const clientId = this.config.get<string>('AMOCRM_CLIENT_ID', '');
    const redirectUri = this.config.get<string>('AMOCRM_REDIRECT_URI', '');
    return (
      `https://${domain}.amocrm.ru/oauth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${userId}` +
      `&mode=post_message`
    );
  }

  async handleCallback(
    userId: string,
    code: string,
    domain: string,
  ) {
    const clientId = this.config.get<string>('AMOCRM_CLIENT_ID');
    const clientSecret = this.config.get<string>('AMOCRM_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('AMOCRM_REDIRECT_URI');

    const tokenUrl = `https://${domain}.amocrm.ru/oauth2/access_token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`AmoCRM token exchange failed: ${error}`);
      throw new BadRequestException('Failed to connect to AmoCRM');
    }

    const tokens: AmoCrmTokenResponse = await response.json();

    return this.prisma.amoCrmIntegration.upsert({
      where: { user_id: userId },
      update: {
        amocrm_domain: domain,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires: new Date(Date.now() + tokens.expires_in * 1000),
        status: 'active',
      },
      create: {
        user_id: userId,
        amocrm_domain: domain,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
  }

  async syncLeads(userId: string) {
    const integration = await this.getActiveIntegration(userId);
    const token = await this.ensureFreshToken(integration);

    // Pull leads from AmoCRM
    const amoCrmLeads = await this.fetchAmoCrmLeads(
      integration.amocrm_domain,
      token,
    );

    // Push local leads with status changes to AmoCRM deals
    const localLeads = await this.prisma.lead.findMany({
      where: {
        user_id: userId,
        status: { in: ['interested', 'meeting_booked', 'won'] },
      },
    });

    let pushed = 0;
    for (const lead of localLeads) {
      try {
        await this.pushLeadToAmoCrm(
          integration.amocrm_domain,
          token,
          {
            email: lead.email,
            first_name: lead.first_name ?? undefined,
            last_name: lead.last_name ?? undefined,
            company: lead.company ?? undefined,
            status: lead.status,
          },
        );
        pushed++;
      } catch (err) {
        this.logger.warn(
          `Failed to push lead ${lead.id} to AmoCRM: ${err.message}`,
        );
      }
    }

    return {
      pulled: amoCrmLeads.length,
      pushed,
      synced_at: new Date().toISOString(),
    };
  }

  async disconnect(userId: string) {
    const integration = await this.prisma.amoCrmIntegration.findUnique({
      where: { user_id: userId },
    });
    if (!integration) {
      throw new NotFoundException('AmoCRM integration not found');
    }

    return this.prisma.amoCrmIntegration.update({
      where: { user_id: userId },
      data: { status: 'disconnected' },
    });
  }

  async getStatus(userId: string) {
    const integration = await this.prisma.amoCrmIntegration.findUnique({
      where: { user_id: userId },
    });

    if (!integration) {
      return { connected: false };
    }

    return {
      connected: integration.status === 'active',
      status: integration.status,
      domain: integration.amocrm_domain,
      token_expires: integration.token_expires,
    };
  }

  // ── Private helpers ──

  private async getActiveIntegration(userId: string) {
    const integration = await this.prisma.amoCrmIntegration.findUnique({
      where: { user_id: userId },
    });

    if (!integration || integration.status === 'disconnected') {
      throw new BadRequestException('AmoCRM is not connected');
    }

    return integration;
  }

  private async ensureFreshToken(
    integration: Awaited<ReturnType<typeof this.getActiveIntegration>>,
  ): Promise<string> {
    if (integration.token_expires > new Date()) {
      return integration.access_token;
    }

    // Refresh the token
    const clientId = this.config.get<string>('AMOCRM_CLIENT_ID');
    const clientSecret = this.config.get<string>('AMOCRM_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('AMOCRM_REDIRECT_URI');
    const tokenUrl = `https://${integration.amocrm_domain}.amocrm.ru/oauth2/access_token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: integration.refresh_token,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      await this.prisma.amoCrmIntegration.update({
        where: { id: integration.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException(
        'AmoCRM token expired. Please reconnect.',
      );
    }

    const tokens: AmoCrmTokenResponse = await response.json();

    await this.prisma.amoCrmIntegration.update({
      where: { id: integration.id },
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires: new Date(Date.now() + tokens.expires_in * 1000),
        status: 'active',
      },
    });

    return tokens.access_token;
  }

  private async fetchAmoCrmLeads(
    domain: string,
    accessToken: string,
  ): Promise<any[]> {
    const url = `https://${domain}.amocrm.ru/api/v4/leads?limit=250`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.logger.error(`Failed to fetch AmoCRM leads: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data?._embedded?.leads ?? [];
  }

  private async pushLeadToAmoCrm(
    domain: string,
    accessToken: string,
    lead: { email: string; first_name?: string; last_name?: string; company?: string; status: string },
  ) {
    const statusMap: Record<string, number> = {
      interested: 142, // customize pipeline stage IDs per account
      meeting_booked: 143,
      won: 142,
    };

    const url = `https://${domain}.amocrm.ru/api/v4/leads/complex`;

    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          name: `${lead.first_name ?? ''} ${lead.last_name ?? ''} — ${lead.company ?? 'Unknown'}`.trim(),
          status_id: statusMap[lead.status] ?? 142,
          _embedded: {
            contacts: [
              {
                first_name: lead.first_name ?? '',
                last_name: lead.last_name ?? '',
                custom_fields_values: [
                  {
                    field_code: 'EMAIL',
                    values: [{ value: lead.email, enum_code: 'WORK' }],
                  },
                ],
              },
            ],
          },
        },
      ]),
    });
  }
}
