import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TicketsController } from './presentation/controllers/tickets.controller';
import { CreateTicketUseCase } from './application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from './application/use-cases/UpdateAECUseCase';
import { DeleteAECUseCase } from './application/use-cases/DeleteAECUseCase';
import { EstimateEffortUseCase } from './application/use-cases/EstimateEffortUseCase';
import { ValidateInputUseCase } from './application/use-cases/ValidateInputUseCase';
import { TicketInputValidatorAgent } from '../validation/agents/TicketInputValidatorAgent';
import { GenerationOrchestrator } from './application/services/GenerationOrchestrator';
import { ValidationEngine } from './application/services/validation/ValidationEngine';
import { MastraContentGenerator } from './application/services/MastraContentGenerator';
import { FirestoreAECRepository } from './infrastructure/persistence/FirestoreAECRepository';
import { DriftDetectorService } from './infrastructure/services/drift-detector.service';
import { EstimationEngineService } from './infrastructure/services/estimation-engine.service';
import { CompletenessValidator } from './infrastructure/services/validators/CompletenessValidator';
import { TestabilityValidator } from './infrastructure/services/validators/TestabilityValidator';
import { ClarityValidator } from './infrastructure/services/validators/ClarityValidator';
import { FeasibilityValidator } from './infrastructure/services/validators/FeasibilityValidator';
import { ConsistencyValidator } from './infrastructure/services/validators/ConsistencyValidator';
import { ContextAlignmentValidator } from './infrastructure/services/validators/ContextAlignmentValidator';
import { ScopeValidator } from './infrastructure/services/validators/ScopeValidator';
import { AEC_REPOSITORY } from './application/ports/AECRepository';
import { DRIFT_DETECTOR } from './application/services/drift-detector.interface';
import { ESTIMATION_ENGINE } from './application/services/estimation-engine.interface';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';
import { IndexingModule } from '../indexing/indexing.module';
import { GitHubModule } from '../github/github.module';
// Temporarily disabled due to Mastra ESM/CJS compatibility issue
// import { ticketGenerationWorkflow } from './workflows/ticket-generation.workflow';
// import { registerWorkflow, registerService } from '@mastra/core';

@Module({
  imports: [IndexingModule, GitHubModule],
  controllers: [TicketsController],
  providers: [
    CreateTicketUseCase,
    UpdateAECUseCase,
    DeleteAECUseCase,
    EstimateEffortUseCase,
    ValidateInputUseCase,
    TicketInputValidatorAgent,
    GenerationOrchestrator,
    ValidationEngine,
    MastraContentGenerator,
    // Validators
    CompletenessValidator,
    TestabilityValidator,
    ClarityValidator,
    FeasibilityValidator,
    ConsistencyValidator,
    ContextAlignmentValidator,
    ScopeValidator,
    // Validator array injection
    {
      provide: 'VALIDATORS',
      useFactory: (
        completeness: CompletenessValidator,
        testability: TestabilityValidator,
        clarity: ClarityValidator,
        feasibility: FeasibilityValidator,
        consistency: ConsistencyValidator,
        contextAlignment: ContextAlignmentValidator,
        scope: ScopeValidator,
      ) => [
        completeness,
        testability,
        clarity,
        feasibility,
        consistency,
        contextAlignment,
        scope,
      ],
      inject: [
        CompletenessValidator,
        TestabilityValidator,
        ClarityValidator,
        FeasibilityValidator,
        ConsistencyValidator,
        ContextAlignmentValidator,
        ScopeValidator,
      ],
    },
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
export class TicketsModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: any,
    private readonly validationEngine: ValidationEngine,
  ) {}

  async onModuleInit() {
    // TEMP: Mastra workflow registration disabled due to ESM/CJS compatibility issue
    console.log('⚠️  [TicketsModule] Mastra workflow registration temporarily disabled');
    console.log('⚠️  [TicketsModule] Reason: @mastra/core v1.1.0 has ESM dependency incompatibility');
    console.log('⚠️  [TicketsModule] Status: Backend will start, but workflow execution unavailable');
    console.log('⚠️  [TicketsModule] Fix needed: Mastra v2.0 or ESM configuration');
    
    // Rest of module initializes normally
    console.log('✅ [TicketsModule] Module providers registered (AEC, Validation, etc.)');
  }
}
