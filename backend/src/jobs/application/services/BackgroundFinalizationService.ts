import { Injectable, Inject, Logger } from '@nestjs/common';
import { JobRepository, JOB_REPOSITORY } from '../ports/JobRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import { TechSpecGenerator, CodebaseContext } from '../../../tickets/domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../../../tickets/application/ports/TechSpecGeneratorPort';
import { CodebaseAnalyzer } from '../../../tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '../../../tickets/domain/stack-detection/ProjectStackDetector';
import { GitHubFileService } from '../../../github/domain/github-file.service';
import { CODEBASE_ANALYZER } from '../../../tickets/application/ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../../../tickets/application/ports/ProjectStackDetectorPort';
import { GITHUB_FILE_SERVICE } from '../../../tickets/application/ports/GitHubFileServicePort';
import {
  UsageBudgetRepository,
  USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UsageBudgetRepository';
import { NotificationService } from '../../../notifications/notification.service';
import { GenerationProgressCallback } from '../ports/GenerationProgressCallback';
import { AEC } from '../../../tickets/domain/aec/AEC';

/** Retry backoff for auto-retry (attempt 1 -> attempt 2) */
const AUTO_RETRY_BACKOFF_MS = 2000;

@Injectable()
export class BackgroundFinalizationService {
  private readonly logger = new Logger(BackgroundFinalizationService.name);

  constructor(
    @Inject(JOB_REPOSITORY) private readonly jobRepository: JobRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
    @Inject(TECH_SPEC_GENERATOR) private readonly techSpecGenerator: TechSpecGenerator,
    @Inject(CODEBASE_ANALYZER) private readonly codebaseAnalyzer: CodebaseAnalyzer,
    @Inject(PROJECT_STACK_DETECTOR) private readonly stackDetector: ProjectStackDetector,
    @Inject(GITHUB_FILE_SERVICE) private readonly githubFileService: GitHubFileService,
    @Inject(USAGE_BUDGET_REPOSITORY) private readonly usageBudgetRepository: UsageBudgetRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Main entry point: runs background finalization for a given job.
   * Handles auto-retry on first failure (attempt 1 -> attempt 2).
   */
  async run(jobId: string, aecId: string, teamId: string): Promise<void> {
    try {
      await this.executeFinalization(jobId, aecId, teamId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if job was cancelled (race condition guard)
      const currentStatus = await this.jobRepository.getStatus(jobId, teamId);
      if (currentStatus === 'cancelled') {
        this.logger.log(`Job ${jobId} was cancelled, skipping error handling`);
        return;
      }

      // Load job to check attempt number
      const job = await this.jobRepository.findById(jobId, teamId);
      if (!job) {
        this.logger.error(`Job ${jobId} not found during error handling`);
        return;
      }

      if (job.attempt === 1) {
        // Auto-retry: mark as retrying and re-run
        this.logger.warn(`Job ${jobId} failed on attempt 1, auto-retrying: ${errorMessage}`);
        job.markRetrying();
        await this.jobRepository.save(job);

        await this.sleep(AUTO_RETRY_BACKOFF_MS);

        try {
          await this.executeFinalization(jobId, aecId, teamId);
        } catch (retryError) {
          const retryMessage = retryError instanceof Error ? retryError.message : String(retryError);
          await this.handleFinalFailure(jobId, teamId, retryMessage);
        }
      } else {
        // Attempt 2 already failed — mark as failed
        await this.handleFinalFailure(jobId, teamId, errorMessage);
      }
    }
  }

  /**
   * Core finalization logic. Mirrors FinalizeSpecUseCase flow with progress reporting.
   */
  private async executeFinalization(
    jobId: string,
    aecId: string,
    teamId: string,
  ): Promise<void> {
    // Build progress callback for this job
    const progressCallback = this.createProgressCallback(jobId, teamId);

    // Phase 1: Load AEC
    await progressCallback.onPhaseUpdate('loading', 5);

    const aec = await this.aecRepository.findById(aecId);
    if (!aec) {
      throw new Error(`AEC ${aecId} not found`);
    }

    if (aec.teamId !== teamId) {
      throw new Error('Workspace mismatch');
    }

    // Check cancellation
    if (await progressCallback.isCancelled()) return;

    // Phase 2: Gather answers
    await progressCallback.onPhaseUpdate('preparing', 10);

    const answersRecord = aec.questionAnswers;
    const allAnswers = Object.entries(answersRecord).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    // Check cancellation
    if (await progressCallback.isCancelled()) return;

    // Phase 3: Build codebase context
    await progressCallback.onPhaseUpdate('analyzing', 20);

    const codebaseContext = await this.buildCodebaseContext(aec);

    // Check cancellation
    if (await progressCallback.isCancelled()) return;

    // Phase 4: Resolve wireframe image URLs (Story 14-3)
    await progressCallback.onPhaseUpdate('preparing', 30);

    const wireframeImageUrls: string[] = [];
    if (aec.includeWireframes && aec.wireframeImageAttachmentIds.length > 0) {
      const attachments = aec.attachments;
      for (const id of aec.wireframeImageAttachmentIds) {
        const attachment = attachments.find((a) => a.id === id);
        if (attachment?.storageUrl) {
          wireframeImageUrls.push(attachment.storageUrl);
        }
      }
    }

    // Check cancellation
    if (await progressCallback.isCancelled()) return;

    // Phase 5: Generate tech spec via LLM
    await progressCallback.onPhaseUpdate('generating', 40);

    const techSpec = await this.techSpecGenerator.generateWithAnswers({
      title: aec.title,
      description: aec.description ?? undefined,
      context: codebaseContext,
      answers: allAnswers,
      ticketType: (aec.type as 'feature' | 'bug' | 'task') ?? undefined,
      reproductionSteps:
        aec.reproductionSteps.length > 0 ? aec.reproductionSteps : undefined,
      includeWireframes: aec.includeWireframes,
      includeApiSpec: aec.includeApiSpec,
      wireframeContext: aec.wireframeContext ?? undefined,
      wireframeImageUrls: wireframeImageUrls.length > 0 ? wireframeImageUrls : undefined,
      apiContext: aec.apiContext ?? undefined,
      trackingContext: { userId: aec.createdBy, teamId, ticketId: aecId },
    }, progressCallback);

    // Check cancellation after expensive LLM call
    if (await progressCallback.isCancelled()) return;

    // Phase 6: Save results
    await progressCallback.onPhaseUpdate('saving', 90);

    aec.setTechSpec(techSpec);
    await this.aecRepository.save(aec);

    // Phase 7: Mark job completed
    await progressCallback.onPhaseUpdate('completed', 100);

    const job = await this.jobRepository.findById(jobId, teamId);
    if (job) {
      job.markCompleted();
      await this.jobRepository.save(job);
    }

    // Clear generation job reference from AEC now that the job is complete.
    // Done after job.markCompleted() so the job is persisted even if AEC save fails.
    aec.clearGenerationJobId();
    await this.aecRepository.save(aec);

    this.logger.log(
      `Job ${jobId} completed for ticket ${aecId} (quality score: ${techSpec.qualityScore})`,
    );

    // Send notification (fire-and-forget)
    if (aec.assignedTo) {
      void this.notificationService
        .notifyTicketReadyForReview(aecId, aec.assignedTo, aec.title)
        .catch(() => {});
    }
  }

  /**
   * Handle terminal failure: mark job as failed and clear AEC reference.
   */
  private async handleFinalFailure(
    jobId: string,
    teamId: string,
    errorMessage: string,
  ): Promise<void> {
    this.logger.error(`Job ${jobId} failed permanently: ${errorMessage}`);

    const job = await this.jobRepository.findById(jobId, teamId);
    if (job) {
      job.markFailed(errorMessage);
      await this.jobRepository.save(job);

      // Clear generation job reference from AEC
      const aec = await this.aecRepository.findById(job.ticketId);
      if (aec) {
        aec.clearGenerationJobId();
        await this.aecRepository.save(aec);
      }
    }
  }

  /**
   * Create a progress callback that writes to the JobRepository.
   */
  private createProgressCallback(
    jobId: string,
    teamId: string,
  ): GenerationProgressCallback {
    return {
      onPhaseUpdate: async (phase: string, percent: number): Promise<void> => {
        await this.jobRepository.updateProgress(jobId, teamId, phase, percent);
      },
      isCancelled: async (): Promise<boolean> => {
        const status = await this.jobRepository.getStatus(jobId, teamId);
        return status === 'cancelled';
      },
    };
  }

  /**
   * Build codebase context from AEC repository context.
   * Mirrors FinalizeSpecUseCase.buildCodebaseContext logic.
   */
  private async buildCodebaseContext(aec: AEC): Promise<CodebaseContext> {
    const repoContext = aec.repositoryContext;

    if (!repoContext) {
      this.logger.warn('No repository context available, using minimal context');
      return this.createMinimalContext();
    }

    try {
      const [owner, repo] = repoContext.repositoryFullName.split('/');
      this.logger.log(`Analyzing repository: ${repoContext.repositoryFullName}`);

      const fileTree = await this.githubFileService.getTree(
        owner,
        repo,
        repoContext.branchName,
      );

      const filesMap = new Map<string, string>();
      const keyFiles = [
        'package.json',
        'tsconfig.json',
        'requirements.txt',
        'Dockerfile',
        'pom.xml',
      ];

      for (const fileName of keyFiles) {
        try {
          const content = await this.githubFileService.readFile(
            owner,
            repo,
            fileName,
            repoContext.branchName,
          );
          filesMap.set(fileName, content);
        } catch {
          // File may not exist — this is expected
        }
      }

      const stack = await this.stackDetector.detectStack(filesMap);
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      this.logger.log(
        `Repository context built with framework: ${stack.framework?.name || 'unknown'}`,
      );

      return {
        stack,
        analysis,
        fileTree,
        files: filesMap,
        taskAnalysis: aec.taskAnalysis,
      };
    } catch (error) {
      this.logger.error(
        `Error building context: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.createMinimalContext();
    }
  }

  /**
   * Create a minimal codebase context when no repository is available.
   */
  private createMinimalContext(): CodebaseContext {
    return {
      stack: {
        framework: null,
        language: { name: 'unknown', detected: false, confidence: 0 },
        packageManager: { type: 'npm' },
        dependencies: [],
        devDependencies: [],
        tooling: {},
        hasWorkspaces: false,
        isMonorepo: false,
      },
      analysis: {
        architecture: { type: 'unknown', confidence: 0, signals: [], directories: [] },
        naming: {
          files: 'kebab-case',
          variables: 'camelCase',
          functions: 'camelCase',
          classes: 'PascalCase',
          components: 'PascalCase',
          confidence: 0,
        },
        testing: {
          runner: null,
          location: 'colocated',
          namingPattern: '*.test.ts',
          libraries: [],
          confidence: 0,
        },
        stateManagement: { type: 'unknown', packages: [], patterns: [], confidence: 0 },
        apiRouting: { type: 'unknown', baseDirectory: '', conventions: [], confidence: 0 },
        directories: [],
        overallConfidence: 0,
        recommendations: [],
      },
      fileTree: { sha: '', url: '', tree: [], truncated: false },
      files: new Map(),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
