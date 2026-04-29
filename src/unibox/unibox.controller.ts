import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UniboxService } from './unibox.service';
import { UniboxFilterDto, ReplyDto, UpdateStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('unibox')
@UseGuards(JwtAuthGuard)
export class UniboxController {
  constructor(private readonly uniboxService: UniboxService) {}

  @Get()
  async findAll(@Req() req: Request, @Query() filters: UniboxFilterDto) {
    const user = req.user as { id: string };
    return this.uniboxService.findAll(user.id, filters);
  }

  @Post(':id/reply')
  async reply(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReplyDto,
  ) {
    const user = req.user as { id: string };
    const message = await this.uniboxService.reply(user.id, id, dto);
    return { data: message };
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    const user = req.user as { id: string };
    const message = await this.uniboxService.updateStatus(user.id, id, dto);
    return { data: message };
  }

  @Patch(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const message = await this.uniboxService.markRead(user.id, id);
    return { data: message };
  }
}
