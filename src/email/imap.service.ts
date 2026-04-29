import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';

export interface InboxCheckResult {
  replies: number;
  bounces: number;
  outOfOffice: number;
}

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async checkInbox(accountId: string): Promise<InboxCheckResult> {
    const account = await this.prisma.emailAccount.findUniqueOrThrow({
      where: { id: accountId },
    });

    const imapUsername = this.encryption.decrypt(account.smtp_username);
    const imapPassword = this.encryption.decrypt(account.smtp_password);

    let connection: Imap | null = null;
    const result: InboxCheckResult = { replies: 0, bounces: 0, outOfOffice: 0 };

    try {
      connection = await this.connect(
        account.imap_host,
        account.imap_port,
        imapUsername,
        imapPassword,
      );

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const messages = await this.fetchNewMessages(connection, since);

      this.logger.log(`Found ${messages.length} new messages for account ${accountId}`);

      for (const msg of messages) {
        const classification = await this.processMessage(msg, account);
        if (classification === 'reply') result.replies++;
        else if (classification === 'bounce') result.bounces++;
        else if (classification === 'ooo') result.outOfOffice++;
      }
    } catch (error) {
      this.logger.error(`IMAP check failed for ${accountId}: ${error.message}`);
      throw error;
    } finally {
      if (connection) {
        try { connection.end(); } catch { /* ignore */ }
      }
    }

    return result;
  }

  private async processMessage(
    msg: ParsedMail,
    account: any,
  ): Promise<'reply' | 'bounce' | 'ooo' | null> {
    const inReplyTo = msg.inReplyTo;
    const references = msg.references ?? [];
    const messageIds = [inReplyTo, ...references].filter(Boolean) as string[];

    if (messageIds.length === 0) return null;

    const original = await this.prisma.emailMessage.findFirst({
      where: { message_id: { in: messageIds }, account_id: account.id },
    });

    if (!original) return null;

    const lead = await this.prisma.lead.findUnique({
      where: { id: original.lead_id },
    });
    if (!lead) return null;

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
        where: { id: original.campaign_id },
        data: { bounced_count: { increment: 1 } },
      });
      await this.cancelPendingEmails(lead.id);
      return 'bounce';
    }

    // Detect out-of-office
    if (this.isOutOfOffice(msg)) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { next_send_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      });
      return 'ooo';
    }

    // Real reply
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'replied' },
    });
    await this.prisma.emailMessage.update({
      where: { id: original.id },
      data: { status: 'replied', replied_at: msg.date ?? new Date() },
    });
    await this.prisma.campaign.update({
      where: { id: original.campaign_id },
      data: { replied_count: { increment: 1 } },
    });
    await this.cancelPendingEmails(lead.id);

    // Store in Unibox
    await this.prisma.uniboxMessage.create({
      data: {
        user_id: account.user_id,
        lead_id: lead.id,
        campaign_id: original.campaign_id,
        account_id: account.id,
        from_email: msg.from?.value?.[0]?.address ?? '',
        subject: msg.subject ?? '',
        body: msg.text ?? msg.html ?? '',
        received_at: msg.date ?? new Date(),
      },
    });

    return 'reply';
  }

  private isBounce(msg: ParsedMail): boolean {
    const from = msg.from?.value?.[0]?.address?.toLowerCase() ?? '';
    const subject = (msg.subject ?? '').toLowerCase();
    const indicators = [
      'mailer-daemon', 'postmaster', 'mail delivery',
      'delivery status', 'undeliverable', 'undelivered',
      'failure notice', 'returned mail',
    ];
    return (
      indicators.some((i) => from.includes(i)) ||
      indicators.some((i) => subject.includes(i))
    );
  }

  private isOutOfOffice(msg: ParsedMail): boolean {
    const subject = (msg.subject ?? '').toLowerCase();
    const headers = msg.headers;
    const autoReply = headers?.get('x-autoreply') || headers?.get('auto-submitted');
    if (autoReply && autoReply !== 'no') return true;

    const indicators = [
      'out of office', 'автоответ', 'отсутствую',
      'в отпуске', 'auto-reply', 'automatic reply',
    ];
    return indicators.some((i) => subject.includes(i));
  }

  private async cancelPendingEmails(leadId: string): Promise<void> {
    await this.prisma.emailMessage.updateMany({
      where: { lead_id: leadId, status: 'queued' },
      data: { status: 'bounced' },
    });
  }

  private connect(host: string, port: number, user: string, password: string): Promise<Imap> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user, password, host, port,
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

        const sinceStr = since.toISOString().split('T')[0];
        imap.search(['UNSEEN', ['SINCE', sinceStr]], (err, results) => {
          if (err) return reject(err);
          if (!results || results.length === 0) return resolve([]);

          const messages: ParsedMail[] = [];
          const fetch = imap.fetch(results, { bodies: '', markSeen: false });

          fetch.on('message', (msg) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', (chunk: Buffer) => { buffer += chunk.toString('utf8'); });
              stream.once('end', () => {
                simpleParser(buffer)
                  .then((parsed) => messages.push(parsed))
                  .catch(() => {});
              });
            });
          });

          fetch.once('error', (err) => reject(err));
          fetch.once('end', () => setTimeout(() => resolve(messages), 500));
        });
      });
    });
  }
}
