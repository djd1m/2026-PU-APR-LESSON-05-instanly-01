import { IsOptional, IsString, IsUUID, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UniboxFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class ReplyDto {
  @IsString()
  body: string;
}

export class UpdateStatusDto {
  @IsIn(['interested', 'not_interested', 'meeting_booked', 'won'])
  status: string;
}
