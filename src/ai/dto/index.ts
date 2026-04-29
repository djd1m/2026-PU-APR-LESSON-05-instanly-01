import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateEmailDto {
  @IsString()
  @IsNotEmpty()
  product_description: string;

  @IsString()
  @IsNotEmpty()
  target_audience: string;

  @IsString()
  @IsIn(['formal', 'casual', 'friendly'])
  tone: 'formal' | 'casual' | 'friendly';

  @IsString()
  @IsOptional()
  language: string = 'ru';
}

export class LeadDataDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  industry?: string;
}

export class PersonalizeEmailDto {
  @IsString()
  @IsNotEmpty()
  template: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LeadDataDto)
  lead: LeadDataDto;

  @IsString()
  @IsNotEmpty()
  product_context: string;
}
