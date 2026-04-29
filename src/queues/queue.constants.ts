export const QUEUES = {
  EMAIL_SEND: 'email-send',
  EMAIL_SCHEDULE: 'email-schedule',
  WARMUP_RUN: 'warmup-run',
  WARMUP_SEND: 'warmup-send',
  IMAP_CHECK: 'imap-check',
  AI_GENERATE: 'ai-generate',
  ANALYTICS_UPDATE: 'analytics-update',
} as const;

export const CONCURRENCY = {
  [QUEUES.EMAIL_SEND]: 5,
  [QUEUES.EMAIL_SCHEDULE]: 1,
  [QUEUES.WARMUP_RUN]: 2,
  [QUEUES.WARMUP_SEND]: 3,
  [QUEUES.IMAP_CHECK]: 3,
  [QUEUES.AI_GENERATE]: 10,
  [QUEUES.ANALYTICS_UPDATE]: 1,
} as const;
