import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AnalyticsFilterDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string, filters: AnalyticsFilterDto) {
    const { campaign_id, date_from, date_to } = filters;

    const where: any = {
      campaign: { user_id: userId },
    };
    if (campaign_id) where.campaign_id = campaign_id;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to);
    }

    // Aggregate totals
    const messages = await this.prisma.emailMessage.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {};
    for (const row of messages) {
      statusCounts[row.status] = row._count.id;
    }

    const sent =
      (statusCounts['sent'] || 0) +
      (statusCounts['delivered'] || 0) +
      (statusCounts['opened'] || 0) +
      (statusCounts['replied'] || 0);
    const opened = (statusCounts['opened'] || 0) + (statusCounts['replied'] || 0);
    const replied = statusCounts['replied'] || 0;
    const bounced = statusCounts['bounced'] || 0;

    const rates = {
      open_rate: sent > 0 ? Math.round((opened / sent) * 10000) / 100 : 0,
      reply_rate: sent > 0 ? Math.round((replied / sent) * 10000) / 100 : 0,
      bounce_rate: sent > 0 ? Math.round((bounced / sent) * 10000) / 100 : 0,
    };

    // Daily time-series
    const dailyWhere: any = {
      campaign: { user_id: userId },
      sent_at: { not: null },
    };
    if (campaign_id) dailyWhere.campaign_id = campaign_id;
    if (date_from || date_to) {
      dailyWhere.sent_at = { ...dailyWhere.sent_at };
      if (date_from) dailyWhere.sent_at.gte = new Date(date_from);
      if (date_to) dailyWhere.sent_at.lte = new Date(date_to);
    }

    const allMessages = await this.prisma.emailMessage.findMany({
      where: dailyWhere,
      select: { sent_at: true, status: true, opened_at: true, replied_at: true },
      orderBy: { sent_at: 'asc' },
    });

    const dailyMap = new Map<string, { date: string; sent: number; opened: number; replied: number }>();
    for (const msg of allMessages) {
      const date = msg.sent_at!.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, sent: 0, opened: 0, replied: 0 });
      }
      const day = dailyMap.get(date)!;
      day.sent++;
      if (msg.status === 'opened' || msg.status === 'replied') day.opened++;
      if (msg.status === 'replied') day.replied++;
    }

    return {
      totals: { sent, opened, replied, bounced },
      rates,
      daily: Array.from(dailyMap.values()),
    };
  }

  async getAccountHealth(userId: string) {
    const accounts = await this.prisma.emailAccount.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        email: true,
        health_score: true,
        warmup_status: true,
      },
    });

    const result = await Promise.all(
      accounts.map(async (account) => {
        const counts = await this.prisma.emailMessage.groupBy({
          by: ['status'],
          where: { account_id: account.id },
          _count: { id: true },
        });

        let sent = 0;
        let bounced = 0;
        for (const row of counts) {
          if (row.status !== 'queued') sent += row._count.id;
          if (row.status === 'bounced') bounced = row._count.id;
        }

        return {
          account_id: account.id,
          email: account.email,
          sent,
          bounced,
          health_score: account.health_score,
          warmup_status: account.warmup_status,
        };
      }),
    );

    return result;
  }
}
