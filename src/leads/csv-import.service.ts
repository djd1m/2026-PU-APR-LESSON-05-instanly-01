import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../common/prisma.service';

interface CsvLeadRecord {
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  industry?: string;
  custom_fields?: Record<string, unknown>;
}

export interface ImportResult {
  leads: CsvLeadRecord[];
  stats: {
    total: number;
    imported: number;
    duplicates: number;
    errors: number;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Maps various CSV column names (EN/RU/camelCase) to canonical Lead field names */
const COLUMN_MAP: Record<string, string> = {
  // email
  email: 'email',
  e_mail: 'email',
  'e-mail': 'email',
  email_address: 'email',
  emailaddress: 'email',
  почта: 'email',
  // first_name
  first_name: 'first_name',
  firstname: 'first_name',
  first: 'first_name',
  имя: 'first_name',
  // last_name
  last_name: 'last_name',
  lastname: 'last_name',
  last: 'last_name',
  фамилия: 'last_name',
  // company
  company: 'company',
  company_name: 'company',
  companyname: 'company',
  компания: 'company',
  организация: 'company',
  // title
  title: 'title',
  job_title: 'title',
  jobtitle: 'title',
  position: 'title',
  должность: 'title',
  // industry
  industry: 'industry',
  отрасль: 'industry',
  индустрия: 'industry',
};

const KNOWN_FIELDS = new Set([
  'email',
  'first_name',
  'last_name',
  'company',
  'title',
  'industry',
]);

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFromBuffer(
    userId: string,
    campaignId: string,
    fileBuffer: Buffer,
  ): Promise<ImportResult> {
    // Parse CSV
    const records: Record<string, string>[] = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relaxColumnCount: true,
    });

    const stats = { total: records.length, imported: 0, duplicates: 0, errors: 0 };
    const validLeads: CsvLeadRecord[] = [];
    const seenEmails = new Set<string>();

    // Get existing emails in this campaign to check for duplicates
    const existingLeads = await this.prisma.lead.findMany({
      where: { user_id: userId, campaign_id: campaignId },
      select: { email: true },
    });
    const existingEmails = new Set(
      existingLeads.map((l) => l.email.toLowerCase()),
    );

    for (const raw of records) {
      const mapped = this.mapColumns(raw);

      // Validate email
      if (!mapped.email || !EMAIL_REGEX.test(mapped.email)) {
        stats.errors++;
        continue;
      }

      const emailLower = mapped.email.toLowerCase();

      // Deduplicate within file
      if (seenEmails.has(emailLower)) {
        stats.duplicates++;
        continue;
      }

      // Deduplicate against existing leads in campaign
      if (existingEmails.has(emailLower)) {
        stats.duplicates++;
        seenEmails.add(emailLower);
        continue;
      }

      seenEmails.add(emailLower);
      validLeads.push(mapped);
    }

    stats.imported = validLeads.length;
    return { leads: validLeads, stats };
  }

  private mapColumns(raw: Record<string, string>): CsvLeadRecord {
    const result: Record<string, string> = {};
    const customFields: Record<string, string> = {};

    for (const [rawKey, value] of Object.entries(raw)) {
      const normalizedKey = rawKey.trim().toLowerCase().replace(/[\s-]+/g, '_');
      const canonicalField = COLUMN_MAP[normalizedKey];

      if (canonicalField) {
        result[canonicalField] = value;
      } else if (!KNOWN_FIELDS.has(normalizedKey)) {
        // Unknown columns go to custom_fields
        customFields[rawKey.trim()] = value;
      }
    }

    const lead: CsvLeadRecord = {
      email: result.email || '',
      first_name: result.first_name,
      last_name: result.last_name,
      company: result.company,
      title: result.title,
      industry: result.industry,
    };

    if (Object.keys(customFields).length > 0) {
      lead.custom_fields = customFields;
    }

    return lead;
  }
}
