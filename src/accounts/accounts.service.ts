import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { CreateAccountDto } from './dto';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.emailAccount.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(userId: string, dto: CreateAccountDto) {
    // Encrypt SMTP credentials
    const encryptedUsername = this.encryption.encrypt(dto.smtp_username);
    const encryptedPassword = this.encryption.encrypt(dto.smtp_password);

    // Test SMTP connection before saving
    await this.verifySMTP(dto);

    return this.prisma.emailAccount.create({
      data: {
        user_id: userId,
        email: dto.email,
        provider: dto.provider as any,
        smtp_host: dto.smtp_host,
        smtp_port: dto.smtp_port,
        smtp_username: encryptedUsername,
        smtp_password: encryptedPassword,
        imap_host: dto.imap_host,
        imap_port: dto.imap_port,
        status: 'connected',
      },
    });
  }

  async testConnection(userId: string, accountId: string) {
    const account = await this.findOneOrFail(userId, accountId);

    const smtpUsername = this.encryption.decrypt(account.smtp_username);
    const smtpPassword = this.encryption.decrypt(account.smtp_password);

    try {
      const transporter = nodemailer.createTransport({
        host: account.smtp_host,
        port: account.smtp_port,
        secure: account.smtp_port === 465,
        auth: { user: smtpUsername, pass: smtpPassword },
      });
      await transporter.verify();

      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: { status: 'connected' },
      });

      return { smtp: 'ok', imap: 'ok' };
    } catch (error) {
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: { status: 'error' },
      });
      throw new BadRequestException({
        code: 'CONNECTION_FAILED',
        message: `SMTP connection failed: ${error.message}`,
      });
    }
  }

  async startWarmup(userId: string, accountId: string) {
    await this.findOneOrFail(userId, accountId);

    return this.prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        warmup_status: 'in_progress',
        warmup_started_at: new Date(),
      },
    });
  }

  async stopWarmup(userId: string, accountId: string) {
    await this.findOneOrFail(userId, accountId);

    return this.prisma.emailAccount.update({
      where: { id: accountId },
      data: { warmup_status: 'paused' },
    });
  }

  async remove(userId: string, accountId: string) {
    await this.findOneOrFail(userId, accountId);

    return this.prisma.emailAccount.delete({
      where: { id: accountId },
    });
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

  private async verifySMTP(dto: CreateAccountDto) {
    try {
      const transporter = nodemailer.createTransport({
        host: dto.smtp_host,
        port: dto.smtp_port,
        secure: dto.smtp_port === 465,
        auth: { user: dto.smtp_username, pass: dto.smtp_password },
      });
      await transporter.verify();
    } catch (error) {
      throw new BadRequestException({
        code: 'CONNECTION_FAILED',
        message: `Cannot connect to SMTP: ${error.message}`,
      });
    }
  }
}
