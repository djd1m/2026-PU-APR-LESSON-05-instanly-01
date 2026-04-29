import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getOverview(@Req() req: Request, @Query() filters: AnalyticsFilterDto) {
    const user = req.user as { id: string };
    const data = await this.analyticsService.getOverview(user.id, filters);
    return { data };
  }

  @Get('accounts')
  async getAccountHealth(@Req() req: Request) {
    const user = req.user as { id: string };
    const data = await this.analyticsService.getAccountHealth(user.id);
    return { data };
  }
}
