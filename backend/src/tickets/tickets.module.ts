import { Module, OnModuleInit } from '@nestjs/common';
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
import { ticketGenerationWorkflow } from './workflows/ticket-generation.workflow';
import { registerWorkflow, registerService } from '@mastra/core';

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
    console.log('🔧 [TicketsModule] Registering Mastra workflow and services...');

    try {
      // Register ticket generation workflow
      registerWorkflow('ticket-generation', ticketGenerationWorkflow);
      console.log('✅ [TicketsModule] Registered ticket-generation workflow');

      // Register core services
      registerService('AECRepository', this.aecRepository);
      registerService('ValidationEngine', this.validationEngine);

      // Register MastraContentGenerator
      const contentGenerator = this.moduleRef.get(MastraContentGenerator, { strict: false });
      if (contentGenerator) {
        registerService('MastraContentGenerator', contentGenerator);
        console.log('✅ [TicketsModule] Registered MastraContentGenerator');
      }

      // Register validation services
      const workspaceFactory = this.moduleRef.get('MastraWorkspaceFactory', { strict: false });
      if (workspaceFactory) {
        registerService('MastraWorkspaceFactory', workspaceFactory);
        console.log('✅ [TicketsModule] Registered MastraWorkspaceFactory');
      }

      const preflightValidator = this.moduleRef.get('QuickPreflightValidator', { strict: false });
      if (preflightValidator) {
        registerService('QuickPreflightValidator', preflightValidator);
        console.log('✅ [TicketsModule] Registered QuickPreflightValidator');
      }

      const findingsAgent = this.moduleRef.get('FindingsToQuestionsAgent', { strict: false });
      if (findingsAgent) {
        registerService('FindingsToQuestionsAgent', findingsAgent);
        console.log('✅ [TicketsModule] Registered FindingsToQuestionsAgent');
      }

      // Register IndexQueryService with graceful fallback
      try {
        const { IndexQueryService } = await import('../indexing/application/services/index-query.service');
        const indexQueryService = this.moduleRef.get(IndexQueryService, { strict: false });
        if (indexQueryService) {
          registerService('IndexQueryService', indexQueryService);
          console.log('✅ [TicketsModule] Registered IndexQueryService');
        }
      } catch (error) {
        console.warn('⚠️ [TicketsModule] IndexQueryService not available - workflow will use graceful fallback');
      }

      console.log('✅ [TicketsModule] Mastra workflow registration complete');
    } catch (error) {
      console.error('❌ [TicketsModule] Failed to register Mastra workflow:', error);
      throw error;
    }
  }
}
