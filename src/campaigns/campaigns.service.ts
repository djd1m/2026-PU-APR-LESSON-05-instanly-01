import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCampaignDto, CampaignFilterDto } from './dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: CampaignFilterDto) {
    const { status, page = 1, limit = 20 } = filters;
    const where: any = { user_id: userId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: {
          campaign_accounts: { include: { account: true } },
          _count: { select: { leads: true, email_messages: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async create(userId: string, dto: CreateCampaignDto) {
    // Verify all sending accounts belong to the user
    const accounts = await this.prisma.emailAccount.findMany({
      where: { id: { in: dto.sending_accounts }, user_id: userId },
    });

    if (accounts.length !== dto.sending_accounts.length) {
      throw new BadRequestException('One or more sending accounts not found');
    }

    return this.prisma.campaign.create({
      data: {
        user_id: userId,
        name: dto.name,
        daily_limit: dto.daily_limit,
        schedule: dto.schedule as any,
        campaign_accounts: {
          create: dto.sending_accounts.map((accountId) => ({
            account_id: accountId,
          })),
        },
      },
      include: {
        campaign_accounts: { include: { account: true } },
      },
    });
  }

  async findOne(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, user_id: userId },
      include: {
        campaign_accounts: { include: { account: true } },
        sequence: { include: { steps: { orderBy: { order: 'asc' } } } },
        _count: { select: { leads: true, email_messages: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async start(userId: string, campaignId: string) {
    const campaign = await this.findOne(userId, campaignId);

    // Validate campaign has leads
    const leadsCount = await this.prisma.lead.count({
      where: { campaign_id: campaignId },
    });
    if (leadsCount === 0) {
      throw new BadRequestException({
        code: 'CAMPAIGN_002',
        message: 'Add leads before starting the campaign',
      });
    }

    // Validate campaign has sending accounts
    if (campaign.campaign_accounts.length === 0) {
      throw new BadRequestException({
        code: 'CAMPAIGN_001',
        message: 'Assign email accounts to the campaign',
      });
    }

    // Validate campaign has a sequence
    if (!campaign.sequence || !campaign.sequence.steps.length) {
      throw new BadRequestException({
        code: 'CAMPAIGN_003',
        message: 'Create an email sequence before starting',
      });
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'active',
        started_at: campaign.started_at ?? new Date(),
        total_leads: leadsCount,
      },
      include: {
        campaign_accounts: { include: { account: true } },
      },
    });
  }

  async pause(userId: string, campaignId: string) {
    await this.findOneOrFail(userId, campaignId);

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
      include: {
        campaign_accounts: { include: { account: true } },
      },
    });
  }

  async resume(userId: string, campaignId: string) {
    await this.findOneOrFail(userId, campaignId);

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'active' },
      include: {
        campaign_accounts: { include: { account: true } },
      },
    });
  }

  async delete(userId: string, campaignId: string) {
    await this.findOneOrFail(userId, campaignId);

    return this.prisma.campaign.delete({
      where: { id: campaignId },
    });
  }

  private async findOneOrFail(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, user_id: userId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }
}
