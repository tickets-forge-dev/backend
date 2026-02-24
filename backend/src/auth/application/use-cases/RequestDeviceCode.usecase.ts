import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirestoreDeviceCodeRepository } from '../../infrastructure/persistence/FirestoreDeviceCodeRepository';

export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

@Injectable()
export class RequestDeviceCodeUseCase {
  private readonly EXPIRES_IN = 300; // 5 minutes
  private readonly POLL_INTERVAL = 5; // seconds

  constructor(
    private readonly deviceCodeRepo: FirestoreDeviceCodeRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<DeviceCodeResponse> {
    const record = await this.deviceCodeRepo.create();
    const appUrl = this.configService.get<string>('APP_URL') ?? 'https://forge.app';

    return {
      deviceCode: record.deviceCode,
      userCode: record.userCode,
      verificationUri: `${appUrl}/device`,
      expiresIn: this.EXPIRES_IN,
      interval: this.POLL_INTERVAL,
    };
  }
}
