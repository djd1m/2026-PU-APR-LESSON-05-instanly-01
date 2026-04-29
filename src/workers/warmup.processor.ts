import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../common/prisma.service';
import { QUEUES, CONCURRENCY } from '../queues/queue.constants';

@Injectable()
@Processor(QUEUES.WARMUP_RUN, {
  concurrency: CONCURRENCY[QUEUES.WARMUP_RUN],
})
export class WarmupProcessor extends WorkerHost {
  private readonly logger = new Logger(WarmupProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.WARMUP_SEND) private readonly warmupSendQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ accountId: string }>): Promise<void> {
    const { accountId } = job.data;
    this.logger.log(`Running warmup cycle for account: ${accountId}`);

    const account = await this.prisma.emailAccount.findUniqueOrThrow({
      where: { id: accountId },
    });

    if (account.warmupStatus !== 'in_progress') {
      this.logger.log(`Account ${accountId} warmup not in progress, skipping`);
      return;
    }

    // Calculate days since warmup started
    const daysActive = Math.floor(
      (Date.now() - new Date(account.warmupStartedAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate target volume for today
    const targetVolume = this.calculateWarmupVolume(daysActive);
    this.logger.log(`Account ${accountId}: day ${daysActive}, target volume: ${targetVolume}`);

    // Select warmup peers from the pool (other accounts in warmup or ready state)
    const peers = await this.prisma.emailAccount.findMany({
      where: {
        id: { not: accountId },
        warmupStatus: { in: ['in_progress', 'ready'] },
        status: 'connected',
      },
      take: targetVolume,
    });

    if (peers.length === 0) {
      this.logger.warn(`No warmup peers available for account ${accountId}`);
      return;
    }

    // Schedule warmup:send jobs with random times throughout the day
    for (const peer of peers) {
      const sendDelay = this.randomTimeDelayMs(9, 18); // 9:00 - 18:00 Moscow time

      // Schedule send from account to peer
      await this.warmupSendQueue.add(
        'warmup-send',
        {
          accountId,
          targetEmail: peer.email,
          type: 'send',
        },
        {
          delay: sendDelay,
          attempts: 2,
          backoff: { type: 'fixed', delay: 60000 },
          removeOnComplete: 50,
        },
      );

      // Create warmup job record
      await this.prisma.warmupJob.create({
        data: {
          accountId,
          type: 'send',
          targetEmail: peer.email,
          status: 'pending',
          scheduledAt: new Date(Date.now() + sendDelay),
        },
      });

      // Schedule reply from peer (after random delay 10min - 4h)
      const replyDelay = sendDelay + this.randomBetween(10 * 60 * 1000, 4 * 60 * 60 * 1000);

      await this.warmupSendQueue.add(
        'warmup-reply',
        {
          accountId: peer.id,
          targetEmail: account.email,
          type: 'reply',
        },
        {
          delay: replyDelay,
          attempts: 2,
          backoff: { type: 'fixed', delay: 60000 },
          removeOnComplete: 50,
        },
      );

      await this.prisma.warmupJob.create({
        data: {
          accountId: peer.id,
          type: 'reply',
          targetEmail: account.email,
          status: 'pending',
          scheduledAt: new Date(Date.now() + replyDelay),
        },
      });

      // Occasionally schedule mark_not_spam (30% chance)
      if (Math.random() < 0.3) {
        const markDelay = replyDelay + this.randomBetween(5 * 60 * 1000, 30 * 60 * 1000);

        await this.warmupSendQueue.add(
          'warmup-mark-not-spam',
          {
            accountId: peer.id,
            targetEmail: account.email,
            type: 'mark_not_spam',
          },
          {
            delay: markDelay,
            attempts: 1,
            removeOnComplete: 50,
          },
        );

        await this.prisma.warmupJob.create({
          data: {
            accountId: peer.id,
            type: 'mark_not_spam',
            targetEmail: account.email,
            status: 'pending',
            scheduledAt: new Date(Date.now() + markDelay),
          },
        });
      }
    }

    // Check if warmup is complete (14+ days with good inbox rate)
    if (daysActive >= 14) {
      const inboxRate = await this.measureInboxRate(accountId);
      if (inboxRate >= 0.85) {
        await this.prisma.emailAccount.update({
          where: { id: accountId },
          data: {
            warmupStatus: 'ready',
            healthScore: Math.round(inboxRate * 100),
          },
        });
        this.logger.log(`Account ${accountId} warmup complete! Inbox rate: ${inboxRate}`);
      }
    }
  }

  /**
   * Gradual volume increase mimicking human behavior:
   * Day 1-3: 5 emails/day
   * Day 4-7: 8-17 emails/day
   * Day 8-14: 19-31 emails/day
   * Day 15+: capped at 50
   */
  private calculateWarmupVolume(days: number): number {
    if (days <= 3) return 5;
    if (days <= 7) return 5 + (days - 3) * 3;
    if (days <= 14) return 17 + (days - 7) * 2;
    return Math.min(50, 17 + (days - 7) * 2);
  }

  private async measureInboxRate(accountId: string): Promise<number> {
    const totalJobs = await this.prisma.warmupJob.count({
      where: {
        accountId,
        type: 'send',
        status: 'completed',
        scheduledAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const successfulReplies = await this.prisma.warmupJob.count({
      where: {
        targetEmail: (await this.prisma.emailAccount.findUnique({ where: { id: accountId } }))?.email,
        type: 'reply',
        status: 'completed',
        scheduledAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (totalJobs === 0) return 0;
    return successfulReplies / totalJobs;
  }

  private randomTimeDelayMs(startHour: number, endHour: number): number {
    // Random milliseconds within the sending window (relative to now)
    const now = new Date();
    const moscowHour = (now.getUTCHours() + 3) % 24;
    const hoursRemaining = Math.max(0, endHour - Math.max(moscowHour, startHour));
    return this.randomBetween(0, hoursRemaining * 60 * 60 * 1000);
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
