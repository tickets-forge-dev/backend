import { Module } from '@nestjs/common';
import { TicketsController } from './presentation/controllers/tickets.controller';
import { CreateTicketUseCase } from './application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from './application/use-cases/UpdateAECUseCase';
import { DeleteAECUseCase } from './application/use-cases/DeleteAECUseCase';
import { EstimateEffortUseCase } from './application/use-cases/EstimateEffortUseCase';
import { StartQuestionRoundUseCase } from './application/use-cases/StartQuestionRoundUseCase';
import { SubmitAnswersUseCase } from './application/use-cases/SubmitAnswersUseCase';
import { GenerateQuestionsUseCase } from './application/use-cases/GenerateQuestionsUseCase';
import { SubmitQuestionAnswersUseCase } from './application/use-cases/SubmitQuestionAnswersUseCase';
import { FinalizeSpecUseCase } from './application/use-cases/FinalizeSpecUseCase';
import { ValidationEngine } from './application/services/validation/ValidationEngine';
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
import { GitHubModule } from '../github/github.module';
import { LinearModule } from '../linear/linear.module';
import { JiraModule } from '../jira/jira.module';
import { ExportToLinearUseCase } from './application/use-cases/ExportToLinearUseCase';
import { ExportToJiraUseCase } from './application/use-cases/ExportToJiraUseCase';
import { TechSpecGeneratorImpl } from './application/services/TechSpecGeneratorImpl';
import { TECH_SPEC_GENERATOR } from './application/ports/TechSpecGeneratorPort';
import { CodebaseAnalyzerImpl } from './application/services/CodebaseAnalyzerImpl';
import { ProjectStackDetectorImpl } from './application/services/ProjectStackDetectorImpl';
import { GitHubFileServiceImpl } from '../github/infrastructure/github-file.service';
import { CODEBASE_ANALYZER } from './application/ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from './application/ports/ProjectStackDetectorPort';
import { GITHUB_FILE_SERVICE } from './application/ports/GitHubFileServicePort';
import { DeepAnalysisServiceImpl } from './application/services/DeepAnalysisServiceImpl';
import { RepositoryFingerprintService } from './application/services/RepositoryFingerprintService';
import { ApiDetectionService } from './application/services/ApiDetectionService';
import { TechSpecMarkdownGenerator } from './application/services/TechSpecMarkdownGenerator';
import { AecXmlSerializer } from './application/services/AecXmlSerializer';
import { AttachmentStorageService } from './infrastructure/storage/AttachmentStorageService';
import { DEEP_ANALYSIS_SERVICE } from './application/ports/DeepAnalysisServicePort';

@Module({
  imports: [GitHubModule, LinearModule, JiraModule],
  controllers: [TicketsController],
  providers: [
    CreateTicketUseCase,
    UpdateAECUseCase,
    DeleteAECUseCase,
    EstimateEffortUseCase,
    StartQuestionRoundUseCase,
    SubmitAnswersUseCase,
    GenerateQuestionsUseCase,
    SubmitQuestionAnswersUseCase,
    FinalizeSpecUseCase,
    ExportToLinearUseCase,
    ExportToJiraUseCase,
    ValidationEngine,
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
      ) => [completeness, testability, clarity, feasibility, consistency, contextAlignment, scope],
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
    TechSpecGeneratorImpl,
    {
      provide: TECH_SPEC_GENERATOR,
      useExisting: TechSpecGeneratorImpl,
    },
    {
      provide: CODEBASE_ANALYZER,
      useClass: CodebaseAnalyzerImpl,
    },
    {
      provide: PROJECT_STACK_DETECTOR,
      useClass: ProjectStackDetectorImpl,
    },
    {
      provide: GITHUB_FILE_SERVICE,
      useFactory: (impl: GitHubFileServiceImpl) => impl,
      inject: [GitHubFileServiceImpl],
    },
    RepositoryFingerprintService,
    ApiDetectionService,
    TechSpecMarkdownGenerator,
    AecXmlSerializer,
    AttachmentStorageService,
    DeepAnalysisServiceImpl,
    {
      provide: DEEP_ANALYSIS_SERVICE,
      useExisting: DeepAnalysisServiceImpl,
    },
  ],
  exports: [
    CreateTicketUseCase,
    UpdateAECUseCase,
    EstimateEffortUseCase,
    AEC_REPOSITORY,
    DRIFT_DETECTOR,
    ESTIMATION_ENGINE,
  ],
})
export class TicketsModule {}
