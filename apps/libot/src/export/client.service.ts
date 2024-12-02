import { ImportResPayload } from '@app/common/dto/libot/dto/import-res-payload';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(private readonly httpService: HttpService) {

  }

  async sendNotification(payload: ImportResPayload) {
    const url = payload.webhook[0].url
    this.logger.log(`Send notification to ${url} for job Id - ${payload.id}`)
    try {
      await lastValueFrom(this.httpService.post(url, payload))
    } catch (error) {
      this.logger.error(`Failed to send notification to ${url} for job Id - ${payload.id}`, error)
    }
  }
}
