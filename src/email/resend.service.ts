import { Injectable, Logger } from '@nestjs/common';

export interface ResendSendParams {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface ResendSendResult {
  id: string;
  from: string;
  to: string;
}

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly apiUrl = 'https://api.resend.com/emails';

  async sendEmail(params: ResendSendParams): Promise<ResendSendResult> {
    const { apiKey, from, to, subject, html } = params;

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    const body = await response.json();

    if (!response.ok) {
      const errorMessage = (body as any)?.message || (body as any)?.name || response.statusText;

      if (response.status === 401) {
        throw new Error(`Resend: невалидный API ключ`);
      }
      if (response.status === 429) {
        throw new Error(`Resend: превышен лимит запросов (rate limit)`);
      }
      if (response.status === 422) {
        throw new Error(`Resend: ошибка валидации — ${errorMessage}`);
      }

      throw new Error(`Resend: ошибка ${response.status} — ${errorMessage}`);
    }

    this.logger.log(`Email sent via Resend to ${to}, id: ${body.id}`);

    return {
      id: body.id,
      from,
      to,
    };
  }

  async testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true, message: 'Resend API ключ валиден' };
      }

      if (response.status === 401) {
        return { success: false, message: 'Невалидный Resend API ключ' };
      }

      const body = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Ошибка Resend: ${(body as any)?.message || response.statusText}`,
      };
    } catch (err) {
      return {
        success: false,
        message: `Ошибка подключения к Resend: ${(err as Error).message}`,
      };
    }
  }
}
