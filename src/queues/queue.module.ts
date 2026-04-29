import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUES } from './queue.constants';
import { EmailSendProcessor } from '../workers/email-send.processor';
import { EmailScheduleProcessor } from '../workers/email-schedule.processor';
import { WarmupProcessor } from '../workers/warmup.processor';
import { ImapCheckProcessor } from '../workers/imap-check.processor';
import { AiGenerateProcessor } from '../workers/ai-generate.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', undefined),
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUES.EMAIL_SEND },
      { name: QUEUES.EMAIL_SCHEDULE },
      { name: QUEUES.WARMUP_RUN },
      { name: QUEUES.WARMUP_SEND },
      { name: QUEUES.IMAP_CHECK },
      { name: QUEUES.AI_GENERATE },
      { name: QUEUES.ANALYTICS_UPDATE },
    ),
  ],
  providers: [
    EmailSendProcessor,
    EmailScheduleProcessor,
    WarmupProcessor,
    ImapCheckProcessor,
    AiGenerateProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
