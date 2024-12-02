import { LibotExportStatusEnum } from '@app/common/database/entities';
import { ImportPayload } from '@app/common/dto/libot/dto/import-payload';
import { Artifact, ArtifactsLibotEnum, ImportResPayload } from '@app/common/dto/libot/dto/import-res-payload';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from "fs"
import { GetRecordsService } from '../get-records/get-records.service';
import { ExportJsonDto } from '@app/common/dto/libot/dto/export-json.dto';
import { ConfigService } from '@nestjs/config';
import { ClientService } from './client.service';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private gerRecordService: GetRecordsService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService
  ) { }

  create(createExportDto: ImportPayload) {
    const resPayload = ImportResPayload.fromImportPayload(createExportDto)
    const record = this.gerRecordService.getRecords().find(r => r['mc:id'] === resPayload.catalogRecordID)
    if (!record) {
      throw new BadRequestException("Record not found");
    }
    resPayload.id = this.getRandomNumber(1000000000000, 2000000000000)
    const status = [LibotExportStatusEnum.IN_PROGRESS, LibotExportStatusEnum.IN_PROGRESS, LibotExportStatusEnum.IN_PROGRESS, LibotExportStatusEnum.IN_PROGRESS, LibotExportStatusEnum.PENDING]
    resPayload.status = status[this.getRandomNumber(0, 4)]
    resPayload.createdAt = new Date().toISOString();
    this.writeToFile(resPayload.toString(), `data/exports/${resPayload.id}/payload.json`)
    this.startExportProcess(resPayload.id)
    delete resPayload.ROI
    delete resPayload.description

    return resPayload;
  }


  getMapById(jobId: number) {
    const mapExport = this.readFromFile(`data/exports/${jobId}/payload.json`)
    if (mapExport) {
      return mapExport
    } else {
      throw new BadRequestException("Not found map with id " + jobId)
    }
  }

  startExportProcess(jobId: number) {
    this.logger.log(`Starting export process for job ${jobId}`)

    this.setPayloadStarting(jobId);

    const writeInterval = setInterval(() => {
      let payload = this.readFromFile(`data/exports/${jobId}/payload.json`)
      this.setPayloadProgress(payload)
      this.writeToFile(payload.toString(), `data/exports/${jobId}/payload.json`)
      if (payload.progress == 100) {
        clearInterval(writeInterval)
        this.setPayloadCompleted(jobId)
        this.setPayloadFinished(jobId)
      }
    }, 1000)
  }

  setPayloadInProgress(payload: ImportResPayload) {
    this.logger.debug(`Setting InProgress for job ${payload.id}`)

    payload.status = LibotExportStatusEnum.IN_PROGRESS
    payload.estimatedSize = this.getRandomNumber(1000, 300000)
    payload.progress = 0
    this.writeToFile(payload.toString(), `data/exports/${payload.id}/payload.json`)
  }

  setPayloadStarting(jobId: number) {
    let payload: ImportResPayload = this.readFromFile(`data/exports/${jobId}/payload.json`)

    if (payload.status == LibotExportStatusEnum.PENDING) {
      const num = this.getRandomNumber(1, 60) * 1000
      this.logger.debug(`Setting InProgress for job ${jobId} in ${num} ms`)

      setTimeout(() => {
        this.setPayloadInProgress(payload)
      }, num);

    } else {
      this.setPayloadInProgress(payload)
    }
  }
  setPayloadProgress(payload: ImportResPayload): any {
    if (payload.progress < 100) {
      payload.progress = Number(Math.min(payload.progress + (5000 * 100 / payload.estimatedSize), 100).toFixed())
      this.logger.debug(`Progress for job ${payload.id} - ${payload.progress}%`)
    }
  }

  setPayloadCompleted(jobId: number) {
    this.logger.log(`Export process completed for job ${jobId}`)
    let payload: ImportResPayload = this.readFromFile(`data/exports/${jobId}/payload.json`)

    payload.status = LibotExportStatusEnum.COMPLETED
    payload.finishedAt = new Date().toISOString();
    this.writeToFile(payload.toString(), `data/exports/${payload.id}/payload.json`)
  }

  setPayloadFinished(jobId: number) {
    this.logger.log(`Finish export process for job ${jobId}`)
    let payload: ImportResPayload = this.readFromFile(`data/exports/${jobId}/payload.json`)
    const record = this.gerRecordService.getRecords().find(r => r['mc:id'] === payload.catalogRecordID)

    const exportJson = ExportJsonDto.fromRecordAndExportPayload(record, payload)

    const fileName = `${record['mc:productType']}_${record['mc:productId']}_${record['mc:productVersion']}_${this.convertTimestamp(payload.createdAt)}`

    this.writeToFile(exportJson.toString(), `data/exports/${jobId}/${fileName}.json`)
    if (process.env.LIBOT_GPKG_DEMO === "json") {
      this.writeToFile(exportJson, `data/exports/${jobId}/${fileName}.gpkg`)
    } else {
      this.copyGpkgFile(`data/exports/${jobId}/${fileName}.gpkg`)
    }
    const finishedAt = new Date(payload.finishedAt)
    payload.expiredAt = new Date(finishedAt.setDate(finishedAt.getDate() + 1)).toISOString()

    const artifacts: Artifact[] = []
    artifacts.push(this.getArtifact(jobId, ArtifactsLibotEnum.GPKG, fileName, payload.estimatedSize))
    artifacts.push(this.getArtifact(jobId, ArtifactsLibotEnum.METADATA, fileName, payload.estimatedSize))
    payload.artifacts = artifacts

    this.writeToFile(payload, `data/exports/${jobId}/payload.json`)
    this.clientService.sendNotification(payload)
  }

  getArtifact(jobId: number, type: ArtifactsLibotEnum, fileName: string, size: number): Artifact {
    const name = fileName + "." + (type === ArtifactsLibotEnum.GPKG ? "gpkg" : "json")
    const artifact = new Artifact()
    artifact.url = this.configService.get<string>("LIBOT_SERVER_ADDRESS") + `/api/downloads/${jobId}/${name}`
    artifact.name = name
    artifact.type = type
    artifact.size = type == ArtifactsLibotEnum.GPKG ? Number(this.getRandomNumber(size / 2, size / 2 * 3).toFixed()) : this.getRandomNumber(1000, 2000)

    return artifact

  }

  getRandomNumber(min: number, max: number): number {
    // Ensure min is smaller than max
    if (min > max) {
      [min, max] = [max, min];
    }

    // Generate random number between min and max (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  convertTimestamp(timestamp: string): string {
    // Convert string to Date object
    const date = new Date(timestamp);

    // Extract components
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

    // Format the string
    const formattedTimestamp = `${year}_${month}_${day}T${hours}_${minutes}_${seconds}_${milliseconds}Z`;

    return formattedTimestamp;
  }

  writeToFile(data: any, path: string) {
    this.logger.verbose(`Writing file ${path}`)
    if (!fs.existsSync(path)) {
      this.logger.debug(`Writing file - File ${path} not found. Creating...`)
      fs.mkdirSync(path.split("/").slice(0, -1).join("/"), { recursive: true });
    }
    fs.writeFileSync(path, data.toString())
  }

  readFromFile(path: string): ImportResPayload | null {
    this.logger.verbose(`Reading file ${path}`)
    if (!fs.existsSync(path)) {
      this.logger.warn(`Reading file - File ${path} not found`)
      return null
    }
    const data = JSON.parse(fs.readFileSync(path, 'utf-8'))

    return ImportResPayload.fromImportRes(data)
  }

  copyGpkgFile(path: string) {
    this.logger.verbose(`Writing file ${path}`)
    if (!fs.existsSync(path)) {
      this.logger.debug(`Writing file - File ${path} not found. Creating...`)
      fs.mkdirSync(path.split("/").slice(0, -1).join("/"), { recursive: true });
    }
    fs.copyFileSync('data/records/example.gpkg', path)

  }

}
