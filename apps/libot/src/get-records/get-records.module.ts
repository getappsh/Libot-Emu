import { Module } from '@nestjs/common';
import { GetRecordsService } from './get-records.service';
import { GetRecordsController } from './get-records.controller';

@Module({
  controllers: [GetRecordsController],
  providers: [GetRecordsService],
  exports:[GetRecordsService]
})
export class GetRecordsModule {}
