import { Module } from '@nestjs/common';
import { UniboxController } from './unibox.controller';
import { UniboxService } from './unibox.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [UniboxController],
  providers: [UniboxService],
  exports: [UniboxService],
})
export class UniboxModule {}
