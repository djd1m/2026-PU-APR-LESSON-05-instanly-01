export class WarmupStatusDto {
  accountId: string;
  email: string;
  warmupStatus: string;
  day: number;
  currentVolume: number;
  inboxRate: number;
  healthColor: 'red' | 'yellow' | 'green';
  healthScore: number;
  estimatedCompletionDate: string | null;
  warmupStartedAt: string | null;
}

export class WarmupPoolStatsDto {
  accountsInWarmup: number;
  accountsReady: number;
  totalJobsToday: number;
  totalJobsCompleted: number;
  totalJobsFailed: number;
}
