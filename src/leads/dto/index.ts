import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsIn,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeadDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, unknown>;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, unknown>;

  @IsOptional()
  @IsIn([
    'new',
    'contacted',
    'replied',
    'interested',
    'meeting_booked',
    'won',
    'not_interested',
    'bounced',
  ])
  status?: string;
}

export class ImportLeadsDto {
  @IsUUID()
  campaign_id: string;
}

export class LeadFilterDto {
  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @IsOptional()
  @IsIn([
    'new',
    'contacted',
    'replied',
    'interested',
    'meeting_booked',
    'won',
    'not_interested',
    'bounced',
  ])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
