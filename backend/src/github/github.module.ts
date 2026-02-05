import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GitHubController } from './presentation/controllers/github.controller';
import { GitHubOAuthController } from './presentation/controllers/github-oauth.controller';
import { GitHubWebhookHandler } from './infrastructure/webhooks/github-webhook.handler';
import { GitHubTokenService } from './application/services/github-token.service';
import { GitHubFileServiceImpl } from './infrastructure/github-file.service';
import { GITHUB_INTEGRATION_REPOSITORY } from './domain/GitHubIntegrationRepository';
import { FirestoreGitHubIntegrationRepository } from './infrastructure/persistence/firestore-github-integration.repository';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';
import { SharedModule } from '../shared/shared.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [ConfigModule, SharedModule, forwardRef(() => TicketsModule)],
  controllers: [GitHubController, GitHubOAuthController, GitHubWebhookHandler],
  providers: [
    GitHubTokenService,
    GitHubFileServiceImpl,
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
    {
      provide: 'GITHUB_TOKEN',
      useFactory: (configService: ConfigService) => {
        return configService.get<string>('GITHUB_TOKEN') || '';
      },
      inject: [ConfigService],
    },
  ],
  exports: [GitHubTokenService, GitHubFileServiceImpl, GITHUB_INTEGRATION_REPOSITORY],
})
export class GitHubModule {}
