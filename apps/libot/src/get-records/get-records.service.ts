import { Footprint, FootprintType } from '@app/common/dto/libot/dto/footprint';
import { MCRasterRecordDto } from '@app/common/dto/libot/dto/recordsRes.dto';
import { MapProductResDto } from '@app/common/dto/map/dto/map-product-res.dto';
import { Injectable, Logger } from '@nestjs/common';
import booleanIntersects from '@turf/boolean-intersects';
import { Feature, Polygon, polygon } from '@turf/turf';
import * as turf from '@turf/turf';
import * as fs from "fs"

@Injectable()
export class GetRecordsService {

  private readonly logger = new Logger(GetRecordsService.name);
  private records: MCRasterRecordDto[]

  constructor() {
    this.records = this.loadDataFromFile();
  }

  getRecords(): MCRasterRecordDto[] {
    this.logger.log(`Get ${this.records.length} records`)
    return this.records
  }
  
  getRecordsByBBox(polygon: Feature<Polygon>): MCRasterRecordDto[] {
    this.logger.log(`Get records for given bbox`)
    const recordsIntersect = this.records.filter(record => {
      const footprint = new Footprint(record['mc:footprint']);      
      const fpPolygon = footprint.type == FootprintType.POLYGON ? turf.polygon(footprint.coordinates) : turf.multiPolygon(footprint.coordinates);
      return booleanIntersects(fpPolygon, polygon)
    })    
    return recordsIntersect
  }

  private loadDataFromFile(): MCRasterRecordDto[] {
    this.logger.log("Load records from file")
    try {
      const filePath = 'data/records/records.json';
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent) as MCRasterRecordDto[];
      return jsonData;
    } catch (error) {
      this.logger.error('Error loading records from JSON file:', error);
    }
  }


}
