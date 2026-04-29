import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../common/encryption.service';

export interface SendEmailParams {
  account: {
    email: string;
    smtp_host: string;
    smtp_port: number;
    smtp_username: string; // encrypted
    smtp_password: string; // encrypted
  };
  to: string;
  subject: string;
  body: string;
  messageId?: string; // internal tracking ID
}

export interface SendEmailResult {
  messageId: string;
  accepted: string[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly encryption: EncryptionService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const { account, to, subject, body, messageId } = params;

    // Decrypt SMTP credentials
    const smtpUsername = this.encryption.decrypt(account.smtp_username);
    const smtpPassword = this.encryption.decrypt(account.smtp_password);

    // Create Nodemailer transport
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_port === 465,
      auth: { user: smtpUsername, pass: smtpPassword },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
    });

    // Prepare body with tracking
    let htmlBody = body;
    if (messageId) {
      htmlBody = this.addTrackingPixel(htmlBody, messageId);
      htmlBody = this.addClickTracking(htmlBody, messageId);
    }

    const info = await transporter.sendMail({
      from: account.email,
      to,
      subject,
      html: htmlBody,
      headers: {
        'X-Mailer': 'ColdMail.ru',
        'List-Unsubscribe': `<${this.getAppUrl()}/api/v1/unsubscribe/${messageId}>`,
      },
    });

    this.logger.log(`Email sent to ${to}, SMTP messageId: ${info.messageId}`);

    return {
      messageId: info.messageId,
      accepted: info.accepted as string[],
    };
  }

  addTrackingPixel(body: string, messageId: string): string {
    const trackingUrl = `${this.getAppUrl()}/api/v1/track/open/${messageId}`;
    const pixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;

    // Insert before closing </body> tag, or append at end
    if (body.includes('</body>')) {
      return body.replace('</body>', `${pixel}</body>`);
    }
    return body + pixel;
  }

  addClickTracking(body: string, messageId: string): string {
    const appUrl = this.getAppUrl();
    // Wrap href links with tracking redirect
    return body.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const encodedUrl = encodeURIComponent(url);
        return `href="${appUrl}/api/v1/track/click/${messageId}?url=${encodedUrl}"`;
      },
    );
  }

  private getAppUrl(): string {
    return this.configService.get<string>('APP_URL', 'http://localhost:4000');
  }
}
