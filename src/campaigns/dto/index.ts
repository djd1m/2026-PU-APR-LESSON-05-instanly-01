import {
  IsString,
  IsArray,
  IsInt,
  IsOptional,
  IsObject,
  IsUUID,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  sending_accounts: string[];

  @IsObject()
  schedule: {
    timezone: string;
    start_hour: number;
    end_hour: number;
    days: string[];
    max_per_day: number;
  };

  @IsInt()
  @Min(1)
  @Max(1000)
  daily_limit: number;
}

export class CampaignFilterDto {
  @IsOptional()
  @IsIn(['draft', 'active', 'paused', 'completed'])
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
