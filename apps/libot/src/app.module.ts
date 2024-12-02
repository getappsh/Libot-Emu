import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExportModule } from './export/export.module';
import { ConfigModule } from '@nestjs/config';
import { GetRecordsModule } from './get-records/get-records.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { DownloadsModule } from './downloads/downloads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({ httpCls: false, jsonLogger: process.env.LOGGER_FORMAT === 'JSON', name: "Get-map" }),
    ExportModule,
    GetRecordsModule,
    DownloadsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
