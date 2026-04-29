import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SequencesService } from './sequences.service';
import { CreateSequenceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sequences')
@UseGuards(JwtAuthGuard)
export class SequencesController {
  constructor(private readonly sequencesService: SequencesService) {}

  @Post(':campaignId')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateSequenceDto,
  ) {
    const user = req.user as { id: string };
    const sequence = await this.sequencesService.create(
      user.id,
      campaignId,
      dto.steps,
    );
    return { data: sequence };
  }

  @Get(':campaignId')
  async findByCampaign(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    const user = req.user as { id: string };
    const sequence = await this.sequencesService.findByCampaign(
      user.id,
      campaignId,
    );
    return { data: sequence };
  }

  @Put(':campaignId')
  async update(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateSequenceDto,
  ) {
    const user = req.user as { id: string };
    const sequence = await this.sequencesService.update(
      user.id,
      campaignId,
      dto.steps,
    );
    return { data: sequence };
  }

  @Delete(':campaignId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    const user = req.user as { id: string };
    await this.sequencesService.delete(user.id, campaignId);
  }
}
