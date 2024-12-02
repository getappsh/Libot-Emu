import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ExportService } from './export.service';
import { ImportPayload } from '@app/common/dto/libot/dto/import-payload';
import { MCRasterRecordDto } from '@app/common/dto/libot/dto/recordsRes.dto';
import { Feature, Polygon } from '@turf/turf';
import { GetRecordsService } from '../get-records/get-records.service';


@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService, private readonly getRecordsService: GetRecordsService) {}

  @Post()
  create(@Body() createExportDto: ImportPayload) {
    return this.exportService.create(createExportDto);
  }
 
  @Get("/:jobId")
  getMapById(@Param("jobId") jobId: number) {
    return this.exportService.getMapById(jobId);
  }
}
