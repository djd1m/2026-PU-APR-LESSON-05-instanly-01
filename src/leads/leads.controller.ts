import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, ImportLeadsDto, LeadFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll(@Req() req: Request, @Query() filters: LeadFilterDto) {
    const user = req.user as { id: string };
    return this.leadsService.findAll(user.id, filters);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() dto: CreateLeadDto) {
    const user = req.user as { id: string };
    const lead = await this.leadsService.create(user.id, dto);
    return { data: lead };
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype === 'text/csv' ||
          file.originalname.endsWith('.csv')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV files are allowed'), false);
        }
      },
    }),
  )
  async importCsv(
    @Req() req: Request,
    @Body() dto: ImportLeadsDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const user = req.user as { id: string };
    const stats = await this.leadsService.importCsv(
      user.id,
      dto.campaign_id,
      file.buffer,
    );
    return { data: stats };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const user = req.user as { id: string };
    const lead = await this.leadsService.update(user.id, id, dto);
    return { data: lead };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    await this.leadsService.delete(user.id, id);
  }
}
