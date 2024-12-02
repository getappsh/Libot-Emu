import { Get, Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { GetRecordsModule } from '../get-records/get-records.module';
import { ClientService } from './client.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [GetRecordsModule, HttpModule],
  controllers: [ExportController],
  providers: [ExportService, ClientService]
})
export class ExportModule { }
