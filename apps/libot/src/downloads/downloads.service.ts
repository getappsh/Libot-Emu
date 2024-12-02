import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as fs from "fs"

@Injectable()
export class DownloadsService {

  private readonly logger = new Logger(DownloadsService.name);

  getFileBuffer(params: { jobId: number; fileName: string; }, res: Response) {

    this.logger.log(`Start download file ${params.fileName} for job Id - ${params.jobId}`)
    const filePath = `data/exports/${params.jobId}/${params.fileName}`;
    const fileStream = fs.createReadStream(filePath);

    const stats = fs.statSync(filePath);
    const contentLength = stats.size;
    res.setHeader('Content-Length', contentLength);

    const fileType = filePath.split('.').pop().toLowerCase();
    if (fileType === "json") {
      res.setHeader('Content-Type', 'application/json');
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    fileStream.pipe(res);
  }
}
