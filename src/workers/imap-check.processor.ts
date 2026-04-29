import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { QUEUES, CONCURRENCY } from '../queues/queue.constants';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv } from 'crypto';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

@Injectable()
@Processor(QUEUES.IMAP_CHECK, {
  concurrency: CONCURRENCY[QUEUES.IMAP_CHECK],
})
export class ImapCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(ImapCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ accountId: string }>): Promise<void> {
    const { accountId } = job.data;
    this.logger.log(`Checking IMAP for account: ${accountId}`);

    const account = await this.prisma.emailAccount.findUniqueOrThrow({
      where: { id: accountId },
    });

    let imapConnection: Imap | null = null;

    try {
      // Decrypt IMAP credentials
      const imapUsername = this.decrypt(account.smtpUsername);
      const imapPassword = this.decrypt(account.smtpPassword);

      // Connect to IMAP
      imapConnection = await this.connectImap(
        account.imapHost,
        account.imapPort,
        imapUsername,
        imapPassword,
      );

      // Fetch messages since last check
      const lastChecked = account.lastCheckedAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const messages = await this.fetchNewMessages(imapConnection, lastChecked);

      this.logger.log(`Found ${messages.length} new messages for account ${accountId}`);

      for (const msg of messages) {
        await this.processMessage(msg, account);
      }

      // Update last checked timestamp
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: { lastCheckedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `IMAP check failed for account ${accountId}: ${error.message}`,
        error.stack,
      );

      // Update account status on persistent errors
      if (error.message?.includes('AUTHENTICATIONFAILED') || error.message?.includes('LOGIN')) {
        await this.prisma.emailAccount.update({
          where: { id: accountId },
          data: { status: 'error' },
        });
      }

      throw error;
    } finally {
      if (imapConnection) {
        try {
          imapConnection.end();
        } catch {
          // Ignore disconnect errors
        }
      }
    }
  }

  private async processMessage(msg: ParsedMail, account: any): Promise<void> {
    // Match to original sent message via In-Reply-To or References headers
    const inReplyTo = msg.inReplyTo;
    const references = msg.references ?? [];
    const messageIds = [inReplyTo, ...references].filter(Boolean) as string[];

    if (messageIds.length === 0) return;

    // Find original email message by message_id
    const original = await this.prisma.emailMessage.findFirst({
      where: {
        messageId: { in: messageIds },
        accountId: account.id,
      },
    });

    if (!original) {
      // Not a reply to our campaign email
      return;
    }

    const lead = await this.prisma.lead.findUnique({ where: { id: original.leadId } });
    if (!lead) return;

    // Detect bounce
    if (this.isBounce(msg)) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'bounced' },
      });
      await this.prisma.emailMessage.update({
        where: { id: original.id },
        data: { status: 'bounced' },
      });
      await this.prisma.campaign.update({
        where: { id: original.campaignId },
        data: { bouncedCount: { increment: 1 } },
      });
      // Cancel pending emails for this lead
      await this.cancelPendingEmails(lead.id);
      this.logger.log(`Bounce detected for lead ${lead.id}`);
      return;
    }

    // Detect out-of-office
    if (this.isOutOfOffice(msg)) {
      // Reschedule next step +3 days
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: {
          nextSendAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });
      this.logger.log(`OOO detected for lead ${lead.id}, rescheduled +3 days`);
      return;
    }

    // Real reply
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'replied' },
    });

    await this.prisma.emailMessage.update({
      where: { id: original.id },
      data: { status: 'replied', repliedAt: msg.date ?? new Date() },
    });

    await this.prisma.campaign.update({
      where: { id: original.campaignId },
      data: { repliedCount: { increment: 1 } },
    });

    // Stop sequence for this lead
    await this.cancelPendingEmails(lead.id);

    // Store in Unibox
    await this.prisma.uniboxMessage.create({
      data: {
        userId: account.userId,
        leadId: lead.id,
        campaignId: original.campaignId,
        accountId: account.id,
        fromEmail: msg.from?.value?.[0]?.address ?? '',
        subject: msg.subject ?? '',
        body: msg.text ?? msg.html ?? '',
        receivedAt: msg.date ?? new Date(),
      },
    });

    this.logger.log(`Reply received from lead ${lead.id} for campaign ${original.campaignId}`);
  }

  private isBounce(msg: ParsedMail): boolean {
    const from = msg.from?.value?.[0]?.address?.toLowerCase() ?? '';
    const subject = (msg.subject ?? '').toLowerCase();

    const bounceIndicators = [
      'mailer-daemon',
      'postmaster',
      'mail delivery',
      'delivery status',
      'undeliverable',
      'undelivered',
      'failure notice',
      'returned mail',
    ];

    return (
      bounceIndicators.some((indicator) => from.includes(indicator)) ||
      bounceIndicators.some((indicator) => subject.includes(indicator))
    );
  }

  private isOutOfOffice(msg: ParsedMail): boolean {
    const subject = (msg.subject ?? '').toLowerCase();
    const headers = msg.headers;

    const oooIndicators = [
      'out of office',
      'автоответ',
      'отсутствую',
      'в отпуске',
      'auto-reply',
      'automatic reply',
      'i am out',
      'away from',
    ];

    // Check X-Auto-Reply-From header
    const autoReply = headers?.get('x-autoreply') || headers?.get('auto-submitted');
    if (autoReply && autoReply !== 'no') return true;

    return oooIndicators.some((indicator) => subject.includes(indicator));
  }

  private async cancelPendingEmails(leadId: string): Promise<void> {
    await this.prisma.emailMessage.updateMany({
      where: {
        leadId,
        status: 'queued',
      },
      data: { status: 'cancelled' as any },
    });
  }

  private connectImap(host: string, port: number, user: string, password: string): Promise<Imap> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user,
        password,
        host,
        port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 5000,
      });

      imap.once('ready', () => resolve(imap));
      imap.once('error', (err: Error) => reject(err));
      imap.connect();
    });
  }

  private fetchNewMessages(imap: Imap, since: Date): Promise<ParsedMail[]> {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err) => {
        if (err) return reject(err);

        const sinceStr = since.toISOString().split('T')[0]; // YYYY-MM-DD
        imap.search(['UNSEEN', ['SINCE', sinceStr]], (err, results) => {
          if (err) return reject(err);
          if (!results || results.length === 0) return resolve([]);

          const messages: ParsedMail[] = [];
          const fetch = imap.fetch(results, { bodies: '', markSeen: false });

          fetch.on('message', (msg) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', (chunk: Buffer) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                simpleParser(buffer)
                  .then((parsed) => messages.push(parsed))
                  .catch(() => {}); // skip unparseable messages
              });
            });
          });

          fetch.once('error', (err) => reject(err));
          fetch.once('end', () => {
            // Give async parsers a moment to complete
            setTimeout(() => resolve(messages), 500);
          });
        });
      });
    });
  }

  private decrypt(encryptedText: string): string {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(encryptionKey, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
