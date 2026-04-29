import { Injectable } from '@nestjs/common';

interface ComplianceResult {
  compliant: boolean;
  warnings: string[];
  suggestions: string[];
}

// 38-FZ (Russian Federal Law on Advertising) trigger words
const AD_KEYWORDS = [
  'акция',
  'скидка',
  'бесплатно',
  'распродажа',
  'специальное предложение',
  'выгодно',
  'лучшая цена',
  'гарантированный доход',
  'заработок без вложений',
  'пассивный доход',
  'финансовая свобода',
  'только сегодня',
  'ограниченное предложение',
  'эксклюзивно',
  'уникальная возможность',
  'нажмите сейчас',
  'купите сейчас',
  'срочно',
  'последний шанс',
  'не упустите',
];

const UNSUBSCRIBE_PATTERNS = [
  'отписаться',
  'отказаться от рассылки',
  'unsubscribe',
  'opt-out',
  'opt out',
  'отменить подписку',
  'list-unsubscribe',
];

@Injectable()
export class ComplianceService {
  checkEmailCompliance(emailBody: string, senderInfo?: string): ComplianceResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const bodyLower = emailBody.toLowerCase();

    // Check for advertising keywords (38-FZ triggers)
    const foundKeywords: string[] = [];
    for (const keyword of AD_KEYWORDS) {
      if (bodyLower.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    }
    if (foundKeywords.length > 0) {
      warnings.push(
        `Обнаружены рекламные триггеры (38-ФЗ): ${foundKeywords.join(', ')}`,
      );
      suggestions.push(
        'Замените рекламные формулировки на нейтральные деловые выражения. ' +
          'Письмо может быть классифицировано как реклама, что требует маркировки по 38-ФЗ.',
      );
    }

    // Check for missing opt-out/unsubscribe link
    const hasUnsubscribe = UNSUBSCRIBE_PATTERNS.some((pattern) =>
      bodyLower.includes(pattern.toLowerCase()),
    );
    if (!hasUnsubscribe) {
      warnings.push('Отсутствует ссылка для отписки от рассылки');
      suggestions.push(
        'Добавьте ссылку "Отписаться" в конце письма. ' +
          'Это требование 38-ФЗ для рекламных рассылок и рекомендация для деловых писем.',
      );
    }

    // Check for missing sender identification
    if (!senderInfo) {
      const hasSenderIdInBody =
        bodyLower.includes('с уважением') ||
        bodyLower.includes('best regards') ||
        bodyLower.includes('от:') ||
        bodyLower.includes('отправитель:') ||
        /[\w.-]+@[\w.-]+/.test(emailBody) ||
        bodyLower.includes('тел.') ||
        bodyLower.includes('телефон');

      if (!hasSenderIdInBody) {
        warnings.push('Отсутствует идентификация отправителя');
        suggestions.push(
          'Добавьте подпись с указанием ФИО, компании и контактных данных. ' +
            'Это требование 38-ФЗ ст.18 для рекламных сообщений.',
        );
      }
    }

    return {
      compliant: warnings.length === 0,
      warnings,
      suggestions,
    };
  }
}
