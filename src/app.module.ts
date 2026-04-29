import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { SequencesModule } from './sequences/sequences.module';
import { LeadsModule } from './leads/leads.module';
import { WarmupModule } from './warmup/warmup.module';
import { EmailModule } from './email/email.module';
import { AiModule } from './ai/ai.module';
import { UniboxModule } from './unibox/unibox.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ComplianceModule } from './compliance/compliance.module';
import { QueueModule } from './queues/queue.module';
import { AppConfigModule } from './config/config.module';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    AppConfigModule,
    PrismaModule,
    AuthModule,
    AccountsModule,
    CampaignsModule,
    SequencesModule,
    LeadsModule,
    WarmupModule,
    EmailModule,
    AiModule,
    UniboxModule,
    AnalyticsModule,
    ComplianceModule,
    QueueModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
