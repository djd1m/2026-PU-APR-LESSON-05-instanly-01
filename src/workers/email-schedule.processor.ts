import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUES } from '../queues/queue.constants';

@Injectable()
@Processor(QUEUES.EMAIL_SCHEDULE, {
  concurrency: 1,
})
export class EmailScheduleProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailScheduleProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.EMAIL_SEND) private readonly emailSendQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<{ queued: number }> {
    this.logger.log('Running email schedule cycle...');

    let totalQueued = 0;

    // Find all active campaigns
    const campaigns = await this.prisma.campaign.findMany({
      where: { status: 'active' },
      include: {
        sequence: { include: { steps: { orderBy: { order: 'asc' } } } },
      },
    });

    for (const campaign of campaigns) {
      try {
        const queued = await this.scheduleCampaignEmails(campaign);
        totalQueued += queued;
      } catch (error) {
        this.logger.error(
          `Failed to schedule emails for campaign ${campaign.id}: ${error.message}`,
          error.stack,
        );
      }
    }

    this.logger.log(`Schedule cycle complete. Total queued: ${totalQueued}`);
    return { queued: totalQueued };
  }

  private async scheduleCampaignEmails(campaign: any): Promise<number> {
    const schedule = campaign.schedule as {
      timezone: string;
      start_hour: number;
      end_hour: number;
      days: string[];
      max_per_day: number;
    };

    // Check if within sending window
    const now = new Date();
    const tzOffset = this.getTimezoneOffset(schedule.timezone);
    const localHour = (now.getUTCHours() + tzOffset + 24) % 24;
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const localDay = dayNames[now.getUTCDay()];

    if (localHour < schedule.start_hour || localHour >= schedule.end_hour) {
      return 0;
    }

    if (!schedule.days.includes(localDay)) {
      return 0;
    }

    // Get sending accounts with available capacity
    const accounts = await this.prisma.emailAccount.findMany({
      where: {
        id: { in: campaign.sendingAccounts },
        status: 'connected',
        warmupStatus: { in: ['ready', 'in_progress'] },
      },
    });

    // Get leads ready to send
    const leads = await this.prisma.lead.findMany({
      where: {
        campaignId: campaign.id,
        status: { in: ['new', 'contacted'] },
        OR: [
          { nextSendAt: null },
          { nextSendAt: { lte: now } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: schedule.max_per_day - (campaign.sentCount ?? 0),
    });

    if (leads.length === 0) return 0;

    let queued = 0;
    let leadIndex = 0;

    for (const account of accounts) {
      if (leadIndex >= leads.length) break;

      const remaining = account.dailySendLimit - account.sentToday;
      if (remaining <= 0) continue;

      const batchSize = Math.min(remaining, leads.length - leadIndex);

      for (let i = 0; i < batchSize && leadIndex < leads.length; i++, leadIndex++) {
        const lead = leads[leadIndex];
        const steps = campaign.sequence?.steps ?? [];
        const nextStepOrder = (lead.currentStep ?? 0) + 1;
        const step = steps.find((s: any) => s.order === nextStepOrder);

        if (!step) {
          // Lead completed all steps
          await this.prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'contacted' },
          });
          continue;
        }

        // Render template variables
        const subject = this.renderTemplate(step.subject, lead);
        const body = this.renderTemplate(step.body, lead);

        // Create EmailMessage record
        const emailMessage = await this.prisma.emailMessage.create({
          data: {
            campaignId: campaign.id,
            leadId: lead.id,
            accountId: account.id,
            stepOrder: step.order,
            subject,
            body,
            status: 'queued',
          },
        });

        // Add to email:send queue
        await this.emailSendQueue.add(
          'send',
          {
            emailMessageId: emailMessage.id,
            accountId: account.id,
            to: lead.email,
            subject,
            body,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        );

        // Update lead
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            currentStep: step.order,
            nextSendAt: null,
            status: lead.status === 'new' ? 'contacted' : lead.status,
          },
        });

        queued++;
      }
    }

    return queued;
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

  private getTimezoneOffset(timezone: string): number {
    // Simplified timezone offset lookup (hours from UTC)
    const offsets: Record<string, number> = {
      'Europe/Moscow': 3,
      'Europe/Kiev': 2,
      'Europe/London': 0,
      'America/New_York': -5,
      'Asia/Almaty': 6,
    };
    return offsets[timezone] ?? 3; // Default to Moscow
  }
}
