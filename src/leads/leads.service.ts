import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma, LeadStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto';
import { CsvImportService } from './csv-import.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvImportService: CsvImportService,
  ) {}

  async findAll(userId: string, filters: LeadFilterDto) {
    const { campaign_id, status, page = 1, limit = 20 } = filters;

    const where: Prisma.LeadWhereInput = { user_id: userId };
    if (campaign_id) where.campaign_id = campaign_id;
    if (status) where.status = status as LeadStatus;

    const skip = (page - 1) * limit;

    const [leads, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(userId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        user_id: userId,
        email: dto.email,
        campaign_id: dto.campaign_id ?? null,
        first_name: dto.first_name ?? null,
        last_name: dto.last_name ?? null,
        company: dto.company ?? null,
        title: dto.title ?? null,
        industry: dto.industry ?? null,
        custom_fields: dto.custom_fields ?? {},
      },
    });
  }

  async importCsv(userId: string, campaignId: string, fileBuffer: Buffer) {
    // Verify campaign belongs to user
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, user_id: userId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Parse and validate CSV
    const { leads, stats } = await this.csvImportService.importFromBuffer(
      userId,
      campaignId,
      fileBuffer,
    );

    // Bulk insert valid leads
    if (leads.length > 0) {
      await this.prisma.lead.createMany({
        data: leads.map((lead) => ({
          user_id: userId,
          campaign_id: campaignId,
          email: lead.email,
          first_name: lead.first_name ?? null,
          last_name: lead.last_name ?? null,
          company: lead.company ?? null,
          title: lead.title ?? null,
          industry: lead.industry ?? null,
          custom_fields: lead.custom_fields ?? {},
        })),
        skipDuplicates: true,
      });

      // Update campaign total_leads count
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { total_leads: { increment: leads.length } },
      });
    }

    this.logger.log(
      `CSV import for campaign ${campaignId}: imported=${stats.imported}, duplicates=${stats.duplicates}, errors=${stats.errors}`,
    );

    return stats;
  }

  async update(userId: string, leadId: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: Prisma.LeadUpdateInput = {};

    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
    if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
    if (dto.company !== undefined) updateData.company = dto.company;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.industry !== undefined) updateData.industry = dto.industry;
    if (dto.custom_fields !== undefined) updateData.custom_fields = dto.custom_fields as Prisma.InputJsonValue;
    if (dto.status !== undefined) updateData.status = dto.status as LeadStatus;

    return this.prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });
  }

  async delete(userId: string, leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.lead.delete({
      where: { id: leadId },
    });
  }
}
