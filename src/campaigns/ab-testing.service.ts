import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface VariantInput {
  name: string;
  subject: string;
  body: string;
}

interface VariantResult {
  id: string;
  name: string;
  sent_count: number;
  opened_count: number;
  replied_count: number;
  open_rate: number;
  reply_rate: number;
}

@Injectable()
export class AbTestingService {
  constructor(private readonly prisma: PrismaService) {}

  async createTest(
    userId: string,
    campaignId: string,
    testType: 'subject' | 'body',
    variants: VariantInput[],
    minSample = 50,
  ) {
    if (variants.length < 2) {
      throw new BadRequestException('A/B test requires at least 2 variants');
    }

    // Verify campaign ownership
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, user_id: userId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Check no active test exists
    const existing = await this.prisma.abTest.findFirst({
      where: { campaign_id: campaignId, status: 'running' },
    });
    if (existing) {
      throw new BadRequestException(
        'Campaign already has an active A/B test',
      );
    }

    const test = await this.prisma.abTest.create({
      data: {
        campaign_id: campaignId,
        test_type: testType,
        min_sample: minSample,
        variants: {
          create: variants.map((v) => ({
            name: v.name,
            subject: v.subject,
            body: v.body,
          })),
        },
      },
      include: { variants: true },
    });

    // Split existing unsent leads into variant groups
    await this.assignLeadsToVariants(campaignId, test.id);

    return test;
  }

  async getResults(userId: string, campaignId: string): Promise<{
    test_id: string;
    test_type: string;
    status: string;
    variants: VariantResult[];
    winner_id: string | null;
  }> {
    await this.verifyCampaignOwnership(userId, campaignId);

    const test = await this.prisma.abTest.findFirst({
      where: { campaign_id: campaignId },
      orderBy: { created_at: 'desc' },
      include: { variants: true },
    });

    if (!test) {
      throw new NotFoundException('No A/B test found for this campaign');
    }

    const variants: VariantResult[] = test.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sent_count: v.sent_count,
      opened_count: v.opened_count,
      replied_count: v.replied_count,
      open_rate: v.sent_count > 0 ? v.opened_count / v.sent_count : 0,
      reply_rate: v.sent_count > 0 ? v.replied_count / v.sent_count : 0,
    }));

    return {
      test_id: test.id,
      test_type: test.test_type,
      status: test.status,
      variants,
      winner_id: test.winner_id,
    };
  }

  async selectWinner(userId: string, campaignId: string) {
    await this.verifyCampaignOwnership(userId, campaignId);

    const test = await this.prisma.abTest.findFirst({
      where: { campaign_id: campaignId, status: 'running' },
      include: { variants: true },
    });

    if (!test) {
      throw new NotFoundException('No running A/B test found');
    }

    // Check minimum sample size reached
    const totalSent = test.variants.reduce((s, v) => s + v.sent_count, 0);
    if (totalSent < test.min_sample) {
      throw new BadRequestException(
        `Minimum sample size not reached: ${totalSent}/${test.min_sample}`,
      );
    }

    // Select winner by highest reply_rate, then open_rate as tiebreaker
    const scored = test.variants
      .map((v) => ({
        id: v.id,
        reply_rate: v.sent_count > 0 ? v.replied_count / v.sent_count : 0,
        open_rate: v.sent_count > 0 ? v.opened_count / v.sent_count : 0,
      }))
      .sort(
        (a, b) =>
          b.reply_rate - a.reply_rate || b.open_rate - a.open_rate,
      );

    const winnerId = scored[0].id;

    const updated = await this.prisma.abTest.update({
      where: { id: test.id },
      data: { winner_id: winnerId, status: 'completed' },
      include: { variants: true },
    });

    return updated;
  }

  // ── Private helpers ──

  private async verifyCampaignOwnership(
    userId: string,
    campaignId: string,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, user_id: userId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  private async assignLeadsToVariants(
    campaignId: string,
    testId: string,
  ) {
    const variants = await this.prisma.abTestVariant.findMany({
      where: { test_id: testId },
      orderBy: { created_at: 'asc' },
    });

    const leads = await this.prisma.lead.findMany({
      where: { campaign_id: campaignId, status: 'new' },
      select: { id: true },
    });

    // Round-robin assignment stored in lead custom_fields
    for (let i = 0; i < leads.length; i++) {
      const variant = variants[i % variants.length];
      await this.prisma.lead.update({
        where: { id: leads[i].id },
        data: {
          custom_fields: {
            ab_variant_id: variant.id,
            ab_test_id: testId,
          },
        },
      });
    }
  }
}
