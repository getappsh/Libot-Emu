import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MapProductResDto } from '@app/common/dto/map/dto/map-product-res.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
