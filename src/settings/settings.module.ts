import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { EncryptionService } from '../common/encryption.service';
import { ResendService } from '../email/resend.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, EncryptionService, ResendService],
  exports: [SettingsService],
})
export class SettingsModule {}
