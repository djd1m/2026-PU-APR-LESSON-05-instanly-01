import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, TestSmtpDto, TestOpenaiDto } from './dto';

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@Req() req: any) {
    return this.settingsService.getSettings(req.user.id);
  }

  @Patch()
  async updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(req.user.id, dto);
  }

  @Post('test-smtp')
  async testSmtp(@Body() dto: TestSmtpDto) {
    return this.settingsService.testSmtp(dto.host, dto.port, dto.username, dto.password);
  }

  @Post('test-openai')
  async testOpenai(@Body() dto: TestOpenaiDto) {
    return this.settingsService.testOpenai(dto.api_key);
  }
}
