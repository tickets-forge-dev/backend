import { Module } from '@nestjs/common';
import { DeviceAuthController } from './presentation/controllers/device-auth.controller';
import { RequestDeviceCodeUseCase } from './application/use-cases/RequestDeviceCode.usecase';
import { PollDeviceTokenUseCase } from './application/use-cases/PollDeviceToken.usecase';
import { VerifyDeviceCodeUseCase } from './application/use-cases/VerifyDeviceCode.usecase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshToken.usecase';
import { FirestoreDeviceCodeRepository } from './infrastructure/persistence/FirestoreDeviceCodeRepository';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';
// FirestoreTeamRepository is globally available via SharedModule (@Global) — no re-provide needed

/**
 * AuthModule
 *
 * Provides the CLI Device Flow authentication endpoints:
 *   POST /auth/device/request  — initiate device flow
 *   POST /auth/device/token    — poll for completed auth token
 *   POST /auth/device/verify   — browser-side code verification
 *   POST /auth/refresh         — refresh an expired access token
 */
@Module({
  controllers: [DeviceAuthController],
  providers: [
    // Repository
    {
      provide: FirestoreDeviceCodeRepository,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreDeviceCodeRepository(firestore);
      },
      inject: [FirebaseService],
    },
    // Use Cases
    RequestDeviceCodeUseCase,
    PollDeviceTokenUseCase,
    VerifyDeviceCodeUseCase,
    RefreshTokenUseCase,
  ],
})
export class AuthModule {}
