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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, AddMemberDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() dto: CreateWorkspaceDto) {
    const user = req.user as { id: string };
    const workspace = await this.workspacesService.create(user.id, dto);
    return { data: workspace };
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    const workspaces = await this.workspacesService.findAll(user.id);
    return { data: workspaces };
  }

  @Get(':id/stats')
  async stats(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const stats = await this.workspacesService.getStats(user.id, id);
    return { data: stats };
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    const user = req.user as { id: string };
    const member = await this.workspacesService.addMember(
      user.id,
      id,
      dto,
    );
    return { data: member };
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    const user = req.user as { id: string };
    await this.workspacesService.removeMember(user.id, id, targetUserId);
  }
}
