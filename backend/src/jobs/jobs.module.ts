import { Module } from '@nestjs/common';
import { JobsController } from './presentation/controllers/jobs.controller';
import { StartFinalizationUseCase } from './application/use-cases/StartFinalizationUseCase';
import { CancelJobUseCase } from './application/use-cases/CancelJobUseCase';
import { RetryJobUseCase } from './application/use-cases/RetryJobUseCase';
import { ListUserJobsUseCase } from './application/use-cases/ListUserJobsUseCase';
import { BackgroundFinalizationService } from './application/services/BackgroundFinalizationService';
import { JobRecoveryService } from './application/services/JobRecoveryService';
import { JOB_REPOSITORY } from './application/ports/JobRepository.port';
import { FirestoreJobRepository } from './infrastructure/persistence/FirestoreJobRepository';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeamsModule } from '../teams/teams.module';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [
    TicketsModule,
    NotificationsModule,
    TeamsModule,
    GitHubModule,
  ],
  controllers: [JobsController],
  providers: [
    // Use cases
    StartFinalizationUseCase,
    CancelJobUseCase,
    RetryJobUseCase,
    ListUserJobsUseCase,

    // Services
    BackgroundFinalizationService,
    JobRecoveryService,

    // Port -> Implementation bindings
    {
      provide: JOB_REPOSITORY,
      useClass: FirestoreJobRepository,
    },
  ],
  exports: [JOB_REPOSITORY],
})
export class JobsModule {}
