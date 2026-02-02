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
import { getFirestore } from 'firebase-admin/firestore';

const GITHUB_INTEGRATION_REPOSITORY = 'GITHUB_INTEGRATION_REPOSITORY';

@Module({
  imports: [ConfigModule],
  controllers: [GitHubController, GitHubOAuthController],
  providers: [
    GitHubTokenService,
    {
      provide: GITHUB_INTEGRATION_REPOSITORY,
      useFactory: () => {
        const firestore = getFirestore();
        return new FirestoreGitHubIntegrationRepository(firestore);
      },
    },
  ],
  exports: [GitHubTokenService, GITHUB_INTEGRATION_REPOSITORY],
})
export class GitHubModule {}
