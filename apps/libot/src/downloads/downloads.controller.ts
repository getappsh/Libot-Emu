import { Controller, Get, Param, Res } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { Response } from 'express';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) { }

  @Get(':jobId/:fileName')
  getFile(@Param() params: { jobId: number, fileName: string }, @Res() res: Response) {
    return this.downloadsService.getFileBuffer(params, res)

  }
}
