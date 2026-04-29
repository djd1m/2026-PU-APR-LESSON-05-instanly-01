import { Controller, Post, Body } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { IsString, IsOptional } from 'class-validator';

export class CheckComplianceDto {
  @IsString()
  email_body: string;

  @IsOptional()
  @IsString()
  sender_info?: string;
}

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('check')
  check(@Body() dto: CheckComplianceDto) {
    const result = this.complianceService.checkEmailCompliance(
      dto.email_body,
      dto.sender_info,
    );
    return { data: result };
  }
}
