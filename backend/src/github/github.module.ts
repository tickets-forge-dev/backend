/**
 * GitHub Module
 *
 * Provides GitHub API integration:
 * - Repository and branch operations (Story 4.0)
 * - OAuth integration and token management (Story 4.1)
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitHubController } from './presentation/controllers/github.controller';
import { GitHubOAuthController } from './presentation/controllers/github-oauth.controller';
import { GitHubTokenService } from './application/services/github-token.service';
import { FirestoreGitHubIntegrationRepository } from './infrastructure/persistence/firestore-github-integration.repository';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';

const GITHUB_INTEGRATION_REPOSITORY = 'GITHUB_INTEGRATION_REPOSITORY';

@Module({
  imports: [ConfigModule],
  controllers: [GitHubController, GitHubOAuthController],
  providers: [
    GitHubTokenService,
    {
      provide: GITHUB_INTEGRATION_REPOSITORY,
      useFactory: (firebaseService: FirebaseService) => {
        try {
          if (!firebaseService.isFirebaseConfigured()) {
            console.warn('⚠️  GitHub Integration Repository: Firebase not configured, using null repository');
            return null;
          }
          const firestore = firebaseService.getFirestore();
          return new FirestoreGitHubIntegrationRepository(firestore);
        } catch (error) {
          console.warn('⚠️  GitHub Integration Repository: Failed to initialize, using null repository');
          return null;
        }
      },
      inject: [FirebaseService],
    },
  ],
  exports: [GitHubTokenService, GITHUB_INTEGRATION_REPOSITORY],
})
export class GitHubModule {}
