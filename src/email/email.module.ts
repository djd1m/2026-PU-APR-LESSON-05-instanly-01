import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ImapService } from './imap.service';
import { ResendService } from './resend.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  providers: [EmailService, ImapService, ResendService, EncryptionService],
  exports: [EmailService, ImapService, ResendService],
})
export class EmailModule {}
