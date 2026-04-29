import { IsOptional, IsUUID, IsDateString } from 'class-validator';

export class AnalyticsFilterDto {
  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;
}
