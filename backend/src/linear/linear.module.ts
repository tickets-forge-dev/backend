import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '../shared/shared.module';
import { LinearOAuthController } from './presentation/controllers/linear-oauth.controller';
import { LinearTokenService } from './application/services/linear-token.service';
import { LinearApiClient } from './application/services/linear-api-client';
import { LINEAR_INTEGRATION_REPOSITORY } from './domain/LinearIntegrationRepository';
import { FirestoreLinearIntegrationRepository } from './infrastructure/persistence/firestore-linear-integration.repository';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';

@Module({
  imports: [ConfigModule, SharedModule],
  controllers: [LinearOAuthController],
  providers: [
    LinearTokenService,
    LinearApiClient,
    {
      provide: LINEAR_INTEGRATION_REPOSITORY,
      useFactory: (firebaseService: FirebaseService) => {
        try {
          if (!firebaseService.isFirebaseConfigured()) {
            console.warn('⚠️  Linear Integration Repository: Firebase not configured');
            return null;
          }
          const firestore = firebaseService.getFirestore();
          return new FirestoreLinearIntegrationRepository(firestore);
        } catch {
          console.warn('⚠️  Linear Integration Repository: Failed to initialize');
          return null;
        }
      },
      inject: [FirebaseService],
    },
  ],
  exports: [LinearTokenService, LinearApiClient, LINEAR_INTEGRATION_REPOSITORY],
})
export class LinearModule {}
