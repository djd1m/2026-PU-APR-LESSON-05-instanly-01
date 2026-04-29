import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { QUEUES, CONCURRENCY } from '../queues/queue.constants';
import { ConfigService } from '@nestjs/config';

export interface AiGenerateJobData {
  leadId: string;
  template: string;
  productContext: string;
  campaignId: string;
}

export interface AiGenerateResult {
  personalizedBody: string;
  usedFallback: boolean;
}

const SPAM_WORDS = [
  'гарантируем',
  'бесплатно',
  'заработок',
  'без вложений',
  'срочно',
  'только сегодня',
  'акция',
  'скидка 90%',
  'халява',
  'миллион',
  'пассивный доход',
  'guaranteed',
  'free money',
  'act now',
  'limited time',
];

@Injectable()
@Processor(QUEUES.AI_GENERATE, {
  concurrency: CONCURRENCY[QUEUES.AI_GENERATE],
})
export class AiGenerateProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGenerateProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<AiGenerateJobData>): Promise<AiGenerateResult> {
    const { leadId, template, productContext } = job.data;
    this.logger.log(`AI personalization for lead: ${leadId}`);

    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
    });

    // Build prompt from lead data + product context
    const prompt = this.buildPersonalizationPrompt(template, lead, productContext);

    try {
      // Call OpenAI API with 10s timeout
      const personalizedBody = await this.callOpenAI(prompt);

      // Validate output
      if (this.containsSpamWords(personalizedBody)) {
        this.logger.warn(`AI output contains spam words for lead ${leadId}, using fallback`);
        return {
          personalizedBody: this.renderTemplate(template, lead),
          usedFallback: true,
        };
      }

      if (personalizedBody.length > 2000) {
        this.logger.warn(`AI output too long for lead ${leadId}, using fallback`);
        return {
          personalizedBody: this.renderTemplate(template, lead),
          usedFallback: true,
        };
      }

      // Ensure unsubscribe block is present
      let finalBody = personalizedBody;
      if (!this.containsUnsubscribe(finalBody)) {
        finalBody += this.defaultUnsubscribeBlock();
      }

      return {
        personalizedBody: finalBody,
        usedFallback: false,
      };
    } catch (error) {
      this.logger.warn(
        `AI personalization failed for lead ${leadId}: ${error.message}. Using template fallback.`,
      );
      return {
        personalizedBody: this.renderTemplate(template, lead),
        usedFallback: true,
      };
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const apiUrl = this.configService.get<string>(
      'OPENAI_API_URL',
      'https://api.openai.com/v1/chat/completions',
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Ты — копирайтер B2B-продаж.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPersonalizationPrompt(template: string, lead: any, productContext: string): string {
    return `Персонализируй email для получателя.

Продукт: ${productContext}
Получатель: ${lead.firstName ?? ''} ${lead.lastName ?? ''}, ${lead.title ?? ''} в ${lead.company ?? ''} (${lead.industry ?? ''})
Шаблон письма: ${template}

Правила:
- Напиши уникальное вступление (1-2 предложения), упоминающее компанию или роль получателя
- Сохрани основной оффер из шаблона
- Тон: деловой, но дружелюбный
- Длина: 80-150 слов
- Язык: русский
- НЕ используй: спам-слова, обещания гарантий, caps lock
- Верни ТОЛЬКО текст письма, без пояснений`;
  }

  private containsSpamWords(text: string): boolean {
    const lower = text.toLowerCase();
    return SPAM_WORDS.some((word) => lower.includes(word));
  }

  private containsUnsubscribe(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes('отписаться') ||
      lower.includes('unsubscribe') ||
      lower.includes('отказаться от рассылки')
    );
  }

  private defaultUnsubscribeBlock(): string {
    return '\n\n---\nЕсли вы не хотите получать подобные письма, ответьте "отписаться".';
  }

  private renderTemplate(template: string, lead: any): string {
    return template
      .replace(/\{\{first_name\}\}/g, lead.firstName ?? '')
      .replace(/\{\{last_name\}\}/g, lead.lastName ?? '')
      .replace(/\{\{company\}\}/g, lead.company ?? '')
      .replace(/\{\{title\}\}/g, lead.title ?? '')
      .replace(/\{\{email\}\}/g, lead.email ?? '')
      .replace(/\{\{industry\}\}/g, lead.industry ?? '');
  }
}
