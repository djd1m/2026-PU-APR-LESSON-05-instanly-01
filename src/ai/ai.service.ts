import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AppConfigService } from '../config/config.service';
import { GenerateEmailDto, PersonalizeEmailDto } from './dto';
import {
  SPAM_WORDS,
  MIN_EMAIL_WORDS,
  MAX_EMAIL_WORDS,
  MAX_EMAIL_LENGTH,
  AI_MODEL,
  AI_TEMPERATURE,
  AI_MAX_TOKENS,
  AI_TIMEOUT_MS,
} from './ai.constants';

interface GenerateEmailResult {
  subject: string;
  body: string;
  ai_score: number;
}

interface PersonalizeEmailResult {
  personalized_body: string;
  ai_score: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: AppConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.openaiApiKey,
    });
  }

  async generateEmail(dto: GenerateEmailDto): Promise<GenerateEmailResult> {
    const prompt = this.buildGenerationPrompt(dto);

    try {
      const response = await this.callAI(prompt);
      const parsed = this.parseGeneratedEmail(response);

      if (!this.validateOutput(parsed.body)) {
        this.logger.warn('Generated email failed validation, retrying with stricter prompt');
        const retryPrompt = prompt + '\n\nВАЖНО: Строго соблюдай длину 80-150 слов. Не используй спам-слова.';
        const retryResponse = await this.callAI(retryPrompt);
        const retryParsed = this.parseGeneratedEmail(retryResponse);

        return {
          subject: retryParsed.subject,
          body: retryParsed.body,
          ai_score: this.calculateAiScore(retryParsed.body, dto),
        };
      }

      return {
        subject: parsed.subject,
        body: parsed.body,
        ai_score: this.calculateAiScore(parsed.body, dto),
      };
    } catch (error) {
      this.logger.error('AI email generation failed', error);
      throw error;
    }
  }

  async personalizeEmail(dto: PersonalizeEmailDto): Promise<PersonalizeEmailResult> {
    const prompt = this.buildPersonalizationPrompt(dto);

    try {
      const response = await this.callAI(prompt);

      if (this.containsSpamWords(response)) {
        this.logger.warn('Personalized email contains spam words, falling back to template');
        return {
          personalized_body: this.renderVariables(dto.template, dto.lead),
          ai_score: 3,
        };
      }

      if (response.length > MAX_EMAIL_LENGTH) {
        this.logger.warn('Personalized email too long, falling back to template');
        return {
          personalized_body: this.renderVariables(dto.template, dto.lead),
          ai_score: 3,
        };
      }

      return {
        personalized_body: response,
        ai_score: this.calculateAiScore(response, dto),
      };
    } catch (error) {
      this.logger.warn('AI personalization failed, using template fallback', {
        lead_name: dto.lead.first_name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        personalized_body: this.renderVariables(dto.template, dto.lead),
        ai_score: 1,
      };
    }
  }

  private async callAI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const completion = await this.openai.chat.completions.create(
        {
          model: AI_MODEL,
          temperature: AI_TEMPERATURE,
          max_tokens: AI_MAX_TOKENS,
          messages: [
            {
              role: 'system',
              content: 'Ты — профессиональный копирайтер B2B-продаж. Пишешь на русском языке.',
            },
            { role: 'user', content: prompt },
          ],
        },
        { signal: controller.signal },
      );

      return completion.choices[0]?.message?.content?.trim() ?? '';
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildGenerationPrompt(dto: GenerateEmailDto): string {
    const toneMap: Record<string, string> = {
      formal: 'формальный, деловой',
      casual: 'неформальный, разговорный',
      friendly: 'дружелюбный, тёплый',
    };

    return `Напиши холодное B2B-письмо для email-рассылки.

Продукт: ${dto.product_description}
Целевая аудитория: ${dto.target_audience}
Тон: ${toneMap[dto.tone] || dto.tone}
Язык: русский

Формат ответа (строго):
ТЕМА: <тема письма>
ТЕЛО: <текст письма>

Правила:
- Длина тела: 80-150 слов
- Включи чёткий призыв к действию (CTA)
- НЕ используй спам-слова: БЕСПЛАТНО, СРОЧНО, ГАРАНТИЯ 100%, ЗАРАБОТОК
- НЕ используй CAPS LOCK (кроме аббревиатур)
- Укажи, что получатель может отписаться
- Будь конкретным, избегай воды`;
  }

  private buildPersonalizationPrompt(dto: PersonalizeEmailDto): string {
    const { lead } = dto;
    const titlePart = lead.title ? `, ${lead.title}` : '';
    const industryPart = lead.industry ? ` (${lead.industry})` : '';

    return `Ты — копирайтер B2B-продаж. Персонализируй email для получателя.

Продукт: ${dto.product_context}
Получатель: ${lead.first_name}${titlePart} в ${lead.company}${industryPart}
Шаблон письма: ${dto.template}

Правила:
- Напиши уникальное вступление (1-2 предложения), упоминающее компанию или роль получателя
- Сохрани основной оффер из шаблона
- Тон: деловой, но дружелюбный
- Длина: 80-150 слов
- Язык: русский
- НЕ используй: спам-слова, обещания гарантий, caps lock

Верни ТОЛЬКО текст письма, без заголовков и пояснений.`;
  }

  private parseGeneratedEmail(response: string): { subject: string; body: string } {
    const subjectMatch = response.match(/ТЕМА:\s*(.+)/);
    const bodyMatch = response.match(/ТЕЛО:\s*([\s\S]+)/);

    if (subjectMatch && bodyMatch) {
      return {
        subject: subjectMatch[1].trim(),
        body: bodyMatch[1].trim(),
      };
    }

    // Fallback: treat first line as subject, rest as body
    const lines = response.split('\n').filter((l) => l.trim());
    return {
      subject: lines[0]?.trim() || 'Деловое предложение',
      body: lines.slice(1).join('\n').trim() || response,
    };
  }

  private validateOutput(text: string): boolean {
    if (this.containsSpamWords(text)) return false;

    const wordCount = this.countWords(text);
    if (wordCount < MIN_EMAIL_WORDS || wordCount > MAX_EMAIL_WORDS) return false;

    if (text.length > MAX_EMAIL_LENGTH) return false;

    return true;
  }

  private containsSpamWords(text: string): boolean {
    const upper = text.toUpperCase();
    return SPAM_WORDS.some((word) => upper.includes(word));
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }

  private calculateAiScore(
    text: string,
    context: GenerateEmailDto | PersonalizeEmailDto,
  ): number {
    let score = 5;

    // Length quality (optimal: 80-150 words)
    const wordCount = this.countWords(text);
    if (wordCount >= MIN_EMAIL_WORDS && wordCount <= MAX_EMAIL_WORDS) {
      score += 2;
    } else if (wordCount >= 60 && wordCount <= 180) {
      score += 1;
    } else {
      score -= 1;
    }

    // No spam words
    if (!this.containsSpamWords(text)) {
      score += 1;
    } else {
      score -= 2;
    }

    // Has CTA (call to action indicators in Russian)
    const ctaPatterns = [
      'напишите',
      'ответьте',
      'позвоните',
      'свяжитесь',
      'запишитесь',
      'оставьте',
      'перейдите',
      'попробуйте',
      'давайте',
      'предлагаю',
      'готовы',
      'интересно',
      'обсудим',
      'встретимся',
      'звонок',
      'демо',
    ];
    const lowerText = text.toLowerCase();
    const hasCta = ctaPatterns.some((p) => lowerText.includes(p));
    if (hasCta) {
      score += 1;
    }

    // Personalization check (for personalize requests)
    if ('lead' in context) {
      const lead = context.lead;
      const mentionsCompany = lowerText.includes(lead.company.toLowerCase());
      const mentionsName = lowerText.includes(lead.first_name.toLowerCase());
      if (mentionsCompany) score += 0.5;
      if (mentionsName) score += 0.5;
    }

    return Math.max(1, Math.min(10, Math.round(score)));
  }

  private renderVariables(
    template: string,
    lead: { first_name: string; company: string; title?: string; industry?: string },
  ): string {
    return template
      .replace(/\{\{first_name\}\}/g, lead.first_name || 'коллега')
      .replace(/\{\{company\}\}/g, lead.company || '')
      .replace(/\{\{title\}\}/g, lead.title || '')
      .replace(/\{\{industry\}\}/g, lead.industry || '');
  }
}
