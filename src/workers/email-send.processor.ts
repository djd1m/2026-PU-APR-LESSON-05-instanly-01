import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma.service';
import { QUEUES, CONCURRENCY } from '../queues/queue.constants';
import { createDecipheriv } from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface EmailSendJobData {
  emailMessageId: string;
  accountId: string;
  to: string;
  subject: string;
  body: string;
}

@Injectable()
@Processor(QUEUES.EMAIL_SEND, {
  concurrency: CONCURRENCY[QUEUES.EMAIL_SEND],
})
export class EmailSendProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailSendProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<EmailSendJobData>): Promise<void> {
    const { emailMessageId, accountId, to, subject, body } = job.data;

    this.logger.log(`Processing email send job: ${emailMessageId} -> ${to}`);

    try {
      // Fetch account with encrypted credentials
      const account = await this.prisma.emailAccount.findUniqueOrThrow({
        where: { id: accountId },
      });

      // Decrypt SMTP credentials
      const smtpUsername = this.decrypt(account.smtpUsername);
      const smtpPassword = this.decrypt(account.smtpPassword);

      // Create Nodemailer transport
      const transporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpPort === 465,
        auth: {
          user: smtpUsername,
          pass: smtpPassword,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
      });

      // Add tracking pixel
      const trackingPixelUrl = `${this.configService.get('APP_URL')}/api/v1/track/open/${emailMessageId}`;
      const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
      const bodyWithTracking = body + trackingPixel;

      // Send email
      const info = await transporter.sendMail({
        from: `${account.email}`,
        to,
        subject,
        html: bodyWithTracking,
        headers: {
          'X-Mailer': 'ColdMail.ru',
        },
      });

      // Update EmailMessage status to sent
      await this.prisma.emailMessage.update({
        where: { id: emailMessageId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          messageId: info.messageId,
        },
      });

      // Increment account sent_today counter
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          sentToday: { increment: 1 },
        },
      });

      this.logger.log(`Email sent successfully: ${emailMessageId}, messageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email ${emailMessageId}: ${error.message}`, error.stack);

      // Update status to reflect failure after max retries
      if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
        await this.prisma.emailMessage.update({
          where: { id: emailMessageId },
          data: { status: 'bounced' },
        });
      }

      throw error; // Re-throw to trigger BullMQ retry
    }
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
