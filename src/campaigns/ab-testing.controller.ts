import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AbTestingService } from './ab-testing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateAbTestDto {
  test_type: 'subject' | 'body';
  variants: { name: string; subject: string; body: string }[];
  min_sample?: number;
}

@Controller('campaigns/:id/ab-test')
@UseGuards(JwtAuthGuard)
export class AbTestingController {
  constructor(private readonly abTestingService: AbTestingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Param('id') campaignId: string,
    @Body() dto: CreateAbTestDto,
  ) {
    const user = req.user as { id: string };
    const test = await this.abTestingService.createTest(
      user.id,
      campaignId,
      dto.test_type,
      dto.variants,
      dto.min_sample,
    );
    return { data: test };
  }

  @Get('results')
  async results(
    @Req() req: Request,
    @Param('id') campaignId: string,
  ) {
    const user = req.user as { id: string };
    const results = await this.abTestingService.getResults(
      user.id,
      campaignId,
    );
    return { data: results };
  }

  @Post('select-winner')
  @HttpCode(HttpStatus.OK)
  async selectWinner(
    @Req() req: Request,
    @Param('id') campaignId: string,
  ) {
    const user = req.user as { id: string };
    const result = await this.abTestingService.selectWinner(
      user.id,
      campaignId,
    );
    return { data: result };
  }
}
