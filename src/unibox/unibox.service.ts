import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../email/email.service';
import { UniboxFilterDto, ReplyDto, UpdateStatusDto } from './dto';

@Injectable()
export class UniboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(userId: string, filters: UniboxFilterDto) {
    const { status, campaign_id, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (status) where.status = status;
    if (campaign_id) where.campaign_id = campaign_id;

    const [data, total, unread] = await Promise.all([
      this.prisma.uniboxMessage.findMany({
        where,
        orderBy: { received_at: 'desc' },
        skip,
        take: limit,
        include: { lead: true, campaign: { select: { id: true, name: true } } },
      }),
      this.prisma.uniboxMessage.count({ where }),
      this.prisma.uniboxMessage.count({ where: { ...where, read: false } }),
    ]);

    return { data, meta: { total, unread } };
  }

  async reply(userId: string, messageId: string, dto: ReplyDto) {
    const message = await this.prisma.uniboxMessage.findUnique({
      where: { id: messageId },
      include: { account: true, lead: true },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.user_id !== userId) throw new ForbiddenException();

    // Send reply via the same email account
    await this.emailService.sendEmail({
      account: message.account,
      to: message.from_email,
      subject: `Re: ${message.subject}`,
      body: dto.body,
    });

    // Create a new unibox message record for the sent reply
    const reply = await this.prisma.uniboxMessage.create({
      data: {
        user_id: userId,
        lead_id: message.lead_id,
        campaign_id: message.campaign_id,
        account_id: message.account_id,
        from_email: message.account.email,
        subject: `Re: ${message.subject}`,
        body: dto.body,
        read: true,
        status: message.status,
        received_at: new Date(),
      },
    });

    return reply;
  }

  async updateStatus(userId: string, messageId: string, dto: UpdateStatusDto) {
    const message = await this.prisma.uniboxMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.user_id !== userId) throw new ForbiddenException();

    const updated = await this.prisma.uniboxMessage.update({
      where: { id: messageId },
      data: { status: dto.status },
    });

    // Also update the lead status
    await this.prisma.lead.update({
      where: { id: message.lead_id },
      data: { status: dto.status as any },
    });

    return updated;
  }

  async markRead(userId: string, messageId: string) {
    const message = await this.prisma.uniboxMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.user_id !== userId) throw new ForbiddenException();

    return this.prisma.uniboxMessage.update({
      where: { id: messageId },
      data: { read: true },
    });
  }
}
