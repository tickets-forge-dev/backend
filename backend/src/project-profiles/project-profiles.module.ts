import { Module, forwardRef } from '@nestjs/common';
import { ProjectProfilesController } from './presentation/controllers/project-profiles.controller';
import { TriggerScanUseCase } from './application/use-cases/TriggerScanUseCase';
import { GetProfileUseCase } from './application/use-cases/GetProfileUseCase';
import { DeleteProfileUseCase } from './application/use-cases/DeleteProfileUseCase';
import { BackgroundScanService } from './application/services/BackgroundScanService';
import { PROJECT_PROFILE_REPOSITORY } from './application/ports/ProjectProfileRepository.port';
import { FirestoreProjectProfileRepository } from './infrastructure/persistence/FirestoreProjectProfileRepository';
import { JOB_REPOSITORY } from '../jobs/application/ports/JobRepository.port';
import { FirestoreJobRepository } from '../jobs/infrastructure/persistence/FirestoreJobRepository';
import { GitHubModule } from '../github/github.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    GitHubModule,
    forwardRef(() => TicketsModule), // ForwardRef: TicketsModule also imports ProjectProfilesModule
  ],
  controllers: [ProjectProfilesController],
  providers: [
    // Use cases
    TriggerScanUseCase,
    GetProfileUseCase,
    DeleteProfileUseCase,

    // Services
    BackgroundScanService,

    // Port -> Implementation bindings
    {
      provide: PROJECT_PROFILE_REPOSITORY,
      useClass: FirestoreProjectProfileRepository,
    },
    // Own binding — avoids circular dependency with JobsModule
    // FirestoreJobRepository only depends on FirebaseService (globally available)
    {
      provide: JOB_REPOSITORY,
      useClass: FirestoreJobRepository,
    },
  ],
  exports: [PROJECT_PROFILE_REPOSITORY],
})
export class ProjectProfilesModule {}
