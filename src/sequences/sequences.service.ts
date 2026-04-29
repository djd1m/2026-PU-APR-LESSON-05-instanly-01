import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SequenceStepDto } from './dto';

@Injectable()
export class SequencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, campaignId: string, steps: SequenceStepDto[]) {
    await this.verifyCampaignOwnership(userId, campaignId);

    return this.prisma.$transaction(async (tx) => {
      const sequence = await tx.sequence.create({
        data: {
          campaign_id: campaignId,
          steps: {
            create: steps.map((step, index) => ({
              order: index + 1,
              subject: step.subject,
              body: step.body,
              delay_days: step.delay_days,
              ai_personalize: step.ai_personalize ?? false,
            })),
          },
        },
        include: { steps: { orderBy: { order: 'asc' } } },
      });

      return sequence;
    });
  }

  async findByCampaign(userId: string, campaignId: string) {
    await this.verifyCampaignOwnership(userId, campaignId);

    const sequence = await this.prisma.sequence.findUnique({
      where: { campaign_id: campaignId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!sequence) {
      throw new NotFoundException('Sequence not found for this campaign');
    }

    return sequence;
  }

  async update(userId: string, campaignId: string, steps: SequenceStepDto[]) {
    await this.verifyCampaignOwnership(userId, campaignId);

    const existing = await this.prisma.sequence.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      throw new NotFoundException('Sequence not found for this campaign');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.sequenceStep.deleteMany({
        where: { sequence_id: existing.id },
      });

      const sequence = await tx.sequence.update({
        where: { id: existing.id },
        data: {
          steps: {
            create: steps.map((step, index) => ({
              order: index + 1,
              subject: step.subject,
              body: step.body,
              delay_days: step.delay_days,
              ai_personalize: step.ai_personalize ?? false,
            })),
          },
        },
        include: { steps: { orderBy: { order: 'asc' } } },
      });

      return sequence;
    });
  }

  async delete(userId: string, campaignId: string) {
    await this.verifyCampaignOwnership(userId, campaignId);

    const sequence = await this.prisma.sequence.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!sequence) {
      throw new NotFoundException('Sequence not found for this campaign');
    }

    await this.prisma.sequence.delete({
      where: { id: sequence.id },
    });
  }

  renderTemplate(
    template: string,
    lead: Record<string, any>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      const value = lead[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
      // Fallback: remove the placeholder for empty/missing vars
      return '';
    });
  }

  private async verifyCampaignOwnership(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, user_id: userId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }
}
