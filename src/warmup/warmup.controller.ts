import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { WarmupService } from './warmup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('warmup')
@UseGuards(JwtAuthGuard)
export class WarmupController {
  constructor(private readonly warmupService: WarmupService) {}

  // Static route must come before parameterized routes
  @Get('pool/stats')
  async getPoolStats() {
    const stats = await this.warmupService.getPoolStats();
    return { data: stats };
  }

  @Post(':accountId/start')
  @HttpCode(HttpStatus.OK)
  async startWarmup(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    const user = req.user as { id: string };
    const account = await this.warmupService.startWarmup(user.id, accountId);
    return { data: account };
  }

  @Post(':accountId/stop')
  @HttpCode(HttpStatus.OK)
  async stopWarmup(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    const user = req.user as { id: string };
    const account = await this.warmupService.stopWarmup(user.id, accountId);
    return { data: account };
  }

  @Get(':accountId/status')
  async getStatus(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    const user = req.user as { id: string };
    const status = await this.warmupService.getStatus(user.id, accountId);
    return { data: status };
  }
}
