/**
 * AI Email Generation constants for ColdMail.ru
 */

/** Russian B2B spam words that disqualify generated emails */
export const SPAM_WORDS: string[] = [
  'БЕСПЛАТНО',
  'СРОЧНО',
  'ГАРАНТИЯ 100%',
  'ЗАРАБОТОК',
  'БЕЗ ВЛОЖЕНИЙ',
  'ДОХОД',
  'АКЦИЯ',
  'СКИДКА 90%',
  'ТОЛЬКО СЕГОДНЯ',
  'СЕНСАЦИЯ',
  'ШОК',
  'НЕВЕРОЯТНО',
  'МИЛЛИОН',
  'ЛЁГКИЕ ДЕНЬГИ',
  'ЛЕГКИЕ ДЕНЬГИ',
  'ПАССИВНЫЙ ДОХОД',
  'ОБОГАТИТЬСЯ',
  'ЗАРАБОТАЙ',
  'КЛИКНИ',
  'ЖМИТЕ',
];

/** Minimum email body length in words */
export const MIN_EMAIL_WORDS = 80;

/** Maximum email body length in words */
export const MAX_EMAIL_WORDS = 150;

/** Maximum email body length in characters */
export const MAX_EMAIL_LENGTH = 2000;

/** OpenAI model to use for generation */
export const AI_MODEL = 'gpt-4o-mini';

/** Temperature for generation (0-1) */
export const AI_TEMPERATURE = 0.7;

/** Max tokens for AI response */
export const AI_MAX_TOKENS = 500;

/** Timeout for AI API calls in milliseconds */
export const AI_TIMEOUT_MS = 10_000;

/** Minimum acceptable AI quality score */
export const MIN_AI_SCORE = 1;

/** Maximum AI quality score */
export const MAX_AI_SCORE = 10;
