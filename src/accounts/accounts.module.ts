import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, EncryptionService],
  exports: [AccountsService],
})
export class AccountsModule {}
