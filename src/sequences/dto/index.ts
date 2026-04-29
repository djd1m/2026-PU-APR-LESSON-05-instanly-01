import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsInt,
  IsArray,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class SequenceStepDto {
  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsInt()
  @Min(1)
  @Max(14)
  delay_days: number;

  @IsBoolean()
  @IsOptional()
  ai_personalize?: boolean = false;
}

export class CreateSequenceDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => SequenceStepDto)
  steps: SequenceStepDto[];
}
