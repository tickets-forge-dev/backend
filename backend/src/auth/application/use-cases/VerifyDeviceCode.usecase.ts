import { Injectable, BadRequestException } from '@nestjs/common';
import { FirestoreDeviceCodeRepository } from '../../infrastructure/persistence/FirestoreDeviceCodeRepository';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

export interface VerifyDeviceCodeCommand {
  userCode: string;
  userId: string;
}

@Injectable()
export class VerifyDeviceCodeUseCase {
  constructor(
    private readonly deviceCodeRepo: FirestoreDeviceCodeRepository,
    private readonly firebaseService: FirebaseService,
  ) {}

  async execute(command: VerifyDeviceCodeCommand): Promise<void> {
    const record = await this.deviceCodeRepo.findByUserCode(command.userCode);

    if (!record) {
      throw new BadRequestException('invalid_code');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('expired_token');
    }

    const customToken = await this.firebaseService
      .getAuth()
      .createCustomToken(command.userId);

    await this.deviceCodeRepo.authorize(
      record.deviceCode,
      command.userId,
      customToken,
    );
  }
}
