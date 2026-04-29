import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    const accounts = await this.accountsService.findAll(user.id);
    return { data: accounts, meta: { total: accounts.length } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() dto: CreateAccountDto) {
    const user = req.user as { id: string };
    const account = await this.accountsService.create(user.id, dto);
    return { data: account };
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const result = await this.accountsService.testConnection(user.id, id);
    return { data: result };
  }

  @Post(':id/warmup/start')
  @HttpCode(HttpStatus.OK)
  async startWarmup(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const account = await this.accountsService.startWarmup(user.id, id);
    return { data: account };
  }

  @Post(':id/warmup/stop')
  @HttpCode(HttpStatus.OK)
  async stopWarmup(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const account = await this.accountsService.stopWarmup(user.id, id);
    return { data: account };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    await this.accountsService.remove(user.id, id);
  }
}
