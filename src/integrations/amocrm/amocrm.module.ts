import { Module } from '@nestjs/common';
import { AmoCrmController } from './amocrm.controller';
import { AmoCrmService } from './amocrm.service';

@Module({
  controllers: [AmoCrmController],
  providers: [AmoCrmService],
  exports: [AmoCrmService],
})
export class AmoCrmModule {}
