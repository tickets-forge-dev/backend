import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '../shared/shared.module';
import { JiraController } from './presentation/controllers/jira.controller';
import { JiraTokenService } from './application/services/jira-token.service';
import { JiraApiClient } from './application/services/jira-api-client';
import { JIRA_INTEGRATION_REPOSITORY } from './domain/JiraIntegrationRepository';
import { FirestoreJiraIntegrationRepository } from './infrastructure/persistence/firestore-jira-integration.repository';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';

@Module({
  imports: [ConfigModule, SharedModule],
  controllers: [JiraController],
  providers: [
    JiraTokenService,
    JiraApiClient,
    {
      provide: JIRA_INTEGRATION_REPOSITORY,
      useFactory: (firebaseService: FirebaseService) => {
        try {
          if (!firebaseService.isFirebaseConfigured()) {
            console.warn('Jira Integration Repository: Firebase not configured');
            return null;
          }
          const firestore = firebaseService.getFirestore();
          return new FirestoreJiraIntegrationRepository(firestore);
        } catch {
          console.warn('Jira Integration Repository: Failed to initialize');
          return null;
        }
      },
      inject: [FirebaseService],
    },
  ],
  exports: [JiraTokenService, JiraApiClient, JIRA_INTEGRATION_REPOSITORY],
})
export class JiraModule {}
