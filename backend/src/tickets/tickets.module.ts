import { Module } from '@nestjs/common';
import { TicketsController } from './presentation/controllers/tickets.controller';
import { CreateTicketUseCase } from './application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from './application/use-cases/UpdateAECUseCase';
import { EstimateEffortUseCase } from './application/use-cases/EstimateEffortUseCase';
import { GenerationOrchestrator } from './application/services/GenerationOrchestrator';
import { FirestoreAECRepository } from './infrastructure/persistence/FirestoreAECRepository';
import { DriftDetectorService } from './infrastructure/services/drift-detector.service';
import { EstimationEngineService } from './infrastructure/services/estimation-engine.service';
import { AEC_REPOSITORY } from './application/ports/AECRepository';
import { DRIFT_DETECTOR } from './application/services/drift-detector.interface';
import { ESTIMATION_ENGINE } from './application/services/estimation-engine.interface';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';
import { IndexingModule } from '../indexing/indexing.module';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [IndexingModule, GitHubModule],
  controllers: [TicketsController],
  providers: [
    CreateTicketUseCase,
    UpdateAECUseCase,
    EstimateEffortUseCase,
    GenerationOrchestrator,
    {
      provide: AEC_REPOSITORY,
      useClass: FirestoreAECRepository,
    },
    {
      provide: DRIFT_DETECTOR,
      useClass: DriftDetectorService,
    },
    {
      provide: ESTIMATION_ENGINE,
      useClass: EstimationEngineService,
    },
  ],
  exports: [CreateTicketUseCase, UpdateAECUseCase, EstimateEffortUseCase, AEC_REPOSITORY, DRIFT_DETECTOR, ESTIMATION_ENGINE],
})
export class TicketsModule {}
