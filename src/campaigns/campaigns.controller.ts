import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, CampaignFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async findAll(@Req() req: Request, @Query() filters: CampaignFilterDto) {
    const user = req.user as { id: string };
    return this.campaignsService.findAll(user.id, filters);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() dto: CreateCampaignDto) {
    const user = req.user as { id: string };
    const campaign = await this.campaignsService.create(user.id, dto);
    return { data: campaign };
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const campaign = await this.campaignsService.findOne(user.id, id);
    return { data: campaign };
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async start(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const campaign = await this.campaignsService.start(user.id, id);
    return { data: campaign };
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  async pause(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const campaign = await this.campaignsService.pause(user.id, id);
    return { data: campaign };
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const campaign = await this.campaignsService.resume(user.id, id);
    return { data: campaign };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    await this.campaignsService.delete(user.id, id);
  }
}
