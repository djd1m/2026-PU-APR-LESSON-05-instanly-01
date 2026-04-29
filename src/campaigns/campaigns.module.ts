import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { AbTestingController } from './ab-testing.controller';
import { AbTestingService } from './ab-testing.service';

@Module({
  controllers: [CampaignsController, AbTestingController],
  providers: [CampaignsService, AbTestingService],
  exports: [CampaignsService, AbTestingService],
})
export class CampaignsModule {}
