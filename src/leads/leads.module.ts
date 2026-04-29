import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { CsvImportService } from './csv-import.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, CsvImportService],
  exports: [LeadsService],
})
export class LeadsModule {}
