import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ImapService } from './imap.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  providers: [EmailService, ImapService, EncryptionService],
  exports: [EmailService, ImapService],
})
export class EmailModule {}
