import { Body, Controller, Post } from '@nestjs/common';
import { GetRecordsService } from './get-records.service';
import { Feature, Polygon } from '@turf/turf';
import { MCRasterRecordDto } from '@app/common/dto/libot/dto/recordsRes.dto';

@Controller('getRecords')
export class GetRecordsController {

  constructor(private readonly getRecordsService: GetRecordsService) { }

  @Post()
  getRecords(@Body() polygon: Feature<Polygon>): MCRasterRecordDto[] {    
    if (Object.keys(polygon).length > 0) {
      return this.getRecordsService.getRecordsByBBox(polygon)
    }
    return this.getRecordsService.getRecords()
  }
}
