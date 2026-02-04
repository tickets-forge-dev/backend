import { Module, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TicketsController } from './presentation/controllers/tickets.controller';
import { WorkflowController } from './presentation/controllers/workflow.controller';
import { CreateTicketUseCase } from './application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from './application/use-cases/UpdateAECUseCase';
import { DeleteAECUseCase } from './application/use-cases/DeleteAECUseCase';
import { EstimateEffortUseCase } from './application/use-cases/EstimateEffortUseCase';
import { ValidateInputUseCase } from './application/use-cases/ValidateInputUseCase';
import { ExecuteWorkflowUseCase } from './application/use-cases/ExecuteWorkflowUseCase';
import { ResumeWorkflowUseCase } from './application/use-cases/ResumeWorkflowUseCase';
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
import { MastraService, MASTRA_SERVICES } from '../shared/infrastructure/mastra/mastra.service';

@Module({
  imports: [IndexingModule, GitHubModule],
  controllers: [TicketsController, WorkflowController],
  providers: [
    CreateTicketUseCase,
    UpdateAECUseCase,
    DeleteAECUseCase,
    EstimateEffortUseCase,
    ValidateInputUseCase,
    ExecuteWorkflowUseCase,
    ResumeWorkflowUseCase,
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
    // MastraService with dynamic service injection
    {
      provide: 'AECRepository',
      useExisting: AEC_REPOSITORY,
    },
    {
      provide: 'MastraContentGenerator',
      useExisting: MastraContentGenerator,
    },
    MastraService,
  ],
  exports: [CreateTicketUseCase, UpdateAECUseCase, EstimateEffortUseCase, AEC_REPOSITORY, DRIFT_DETECTOR, ESTIMATION_ENGINE, MastraService],
})
export class TicketsModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: any,
    private readonly validationEngine: ValidationEngine,
    private readonly mastraService: MastraService,
  ) {}

  async onModuleInit() {
    // Register additional services that workflow steps need
    try {
      // Register services that are available via moduleRef
      const indexQueryService = this.moduleRef.get('IndexQueryService', { strict: false });
      if (indexQueryService) {
        this.mastraService.registerService(MASTRA_SERVICES.IndexQueryService, indexQueryService);
      }

      const workspaceFactory = this.moduleRef.get('MastraWorkspaceFactory', { strict: false });
      if (workspaceFactory) {
        this.mastraService.registerService(MASTRA_SERVICES.MastraWorkspaceFactory, workspaceFactory);
      }

      const preflightValidator = this.moduleRef.get('QuickPreflightValidator', { strict: false });
      if (preflightValidator) {
        this.mastraService.registerService(MASTRA_SERVICES.QuickPreflightValidator, preflightValidator);
      }

      const findingsAgent = this.moduleRef.get('FindingsToQuestionsAgent', { strict: false });
      if (findingsAgent) {
        this.mastraService.registerService(MASTRA_SERVICES.FindingsToQuestionsAgent, findingsAgent);
      }

      console.log('✅ [TicketsModule] Mastra workflow enabled with Mastra v1.0.0');
      console.log('✅ [TicketsModule] Workflow: ticket-generation (12 steps, 2 HITL suspension points)');
    } catch (error) {
      console.warn('⚠️  [TicketsModule] Some optional services not available:', error);
    }
    
    console.log('✅ [TicketsModule] Module providers registered (AEC, Validation, etc.)');
  }
}
