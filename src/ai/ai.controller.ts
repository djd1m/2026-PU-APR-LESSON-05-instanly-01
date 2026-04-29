import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateEmailDto, PersonalizeEmailDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-email')
  @HttpCode(HttpStatus.OK)
  async generateEmail(@Body() dto: GenerateEmailDto) {
    const result = await this.aiService.generateEmail(dto);
    return { data: result };
  }

  @Post('personalize')
  @HttpCode(HttpStatus.OK)
  async personalizeEmail(@Body() dto: PersonalizeEmailDto) {
    const result = await this.aiService.personalizeEmail(dto);
    return { data: result };
  }
}
