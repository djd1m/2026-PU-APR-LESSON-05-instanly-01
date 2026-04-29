import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WarmupStatusDto, WarmupPoolStatsDto } from './dto';

@Injectable()
export class WarmupService {
  constructor(private readonly prisma: PrismaService) {}

  async startWarmup(userId: string, accountId: string) {
    const account = await this.findOneOrFail(userId, accountId);

    if (account.warmup_status === 'in_progress') {
      throw new BadRequestException('Warmup is already in progress');
    }

    if (account.status !== 'connected') {
      throw new BadRequestException('Account must be connected to start warmup');
    }

    return this.prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        warmup_status: 'in_progress',
        warmup_started_at:
          account.warmup_status === 'paused' && account.warmup_started_at
            ? account.warmup_started_at
            : new Date(),
      },
    });
  }

  async stopWarmup(userId: string, accountId: string) {
    const account = await this.findOneOrFail(userId, accountId);

    if (account.warmup_status !== 'in_progress') {
      throw new BadRequestException('Warmup is not in progress');
    }

    return this.prisma.emailAccount.update({
      where: { id: accountId },
      data: { warmup_status: 'paused' },
    });
  }

  async getStatus(userId: string, accountId: string): Promise<WarmupStatusDto> {
    const account = await this.findOneOrFail(userId, accountId);

    const day = account.warmup_started_at
      ? Math.floor(
          (Date.now() - new Date(account.warmup_started_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    const currentVolume = this.calculateWarmupVolume(day);
    const inboxRate = await this.measureInboxRate(accountId);
    const healthColor = this.getHealthColor(inboxRate);

    let estimatedCompletionDate: string | null = null;
    if (
      account.warmup_status === 'in_progress' &&
      account.warmup_started_at
    ) {
      const daysRemaining = Math.max(0, 14 - day);
      const completionDate = new Date(
        Date.now() + daysRemaining * 24 * 60 * 60 * 1000,
      );
      estimatedCompletionDate = completionDate.toISOString();
    }

    return {
      accountId: account.id,
      email: account.email,
      warmupStatus: account.warmup_status,
      day,
      currentVolume,
      inboxRate: Math.round(inboxRate * 100),
      healthColor,
      healthScore: account.health_score,
      estimatedCompletionDate,
      warmupStartedAt: account.warmup_started_at?.toISOString() ?? null,
    };
  }

  async getPoolStats(): Promise<WarmupPoolStatsDto> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [accountsInWarmup, accountsReady, totalJobsToday, completedToday, failedToday] =
      await Promise.all([
        this.prisma.emailAccount.count({
          where: { warmup_status: 'in_progress' },
        }),
        this.prisma.emailAccount.count({
          where: { warmup_status: 'ready' },
        }),
        this.prisma.warmupJob.count({
          where: { scheduled_at: { gte: todayStart } },
        }),
        this.prisma.warmupJob.count({
          where: { scheduled_at: { gte: todayStart }, status: 'completed' },
        }),
        this.prisma.warmupJob.count({
          where: { scheduled_at: { gte: todayStart }, status: 'failed' },
        }),
      ]);

    return {
      accountsInWarmup,
      accountsReady,
      totalJobsToday,
      totalJobsCompleted: completedToday,
      totalJobsFailed: failedToday,
    };
  }

  /**
   * Gradual volume increase mimicking human behavior:
   * Day 1-3: 5 emails/day
   * Day 4-7: 8-17 emails/day
   * Day 8-14: 19-31 emails/day
   * Day 15+: capped at 50
   */
  calculateWarmupVolume(days: number): number {
    if (days <= 3) return 5;
    if (days <= 7) return 5 + (days - 3) * 3;
    if (days <= 14) return 17 + (days - 7) * 2;
    return Math.min(50, 17 + (days - 7) * 2);
  }

  async measureInboxRate(accountId: string): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const totalJobs = await this.prisma.warmupJob.count({
      where: {
        account_id: accountId,
        type: 'send',
        status: 'completed',
        scheduled_at: { gte: sevenDaysAgo },
      },
    });

    if (totalJobs === 0) return 0;

    const account = await this.prisma.emailAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) return 0;

    const successfulReplies = await this.prisma.warmupJob.count({
      where: {
        target_email: account.email,
        type: 'reply',
        status: 'completed',
        scheduled_at: { gte: sevenDaysAgo },
      },
    });

    return successfulReplies / totalJobs;
  }

  private getHealthColor(inboxRate: number): 'red' | 'yellow' | 'green' {
    if (inboxRate < 0.6) return 'red';
    if (inboxRate < 0.85) return 'yellow';
    return 'green';
  }

  private async findOneOrFail(userId: string, accountId: string) {
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, user_id: userId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }
}
