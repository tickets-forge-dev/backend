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
import {
  GitHubIntegrationRepository,
  GITHUB_INTEGRATION_REPOSITORY,
} from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import { Octokit } from '@octokit/rest';

/** Retry backoff for auto-retry (attempt 1 -> attempt 2) */
const AUTO_RETRY_BACKOFF_MS = 2000;

/** Maximum time allowed for a single LLM generation call (5 minutes) */
const LLM_TIMEOUT_MS = 5 * 60 * 1000;

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
    @Inject(GITHUB_INTEGRATION_REPOSITORY) private readonly githubIntegrationRepository: GitHubIntegrationRepository,
    private readonly githubTokenService: GitHubTokenService,
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

    // Phase 3: Build codebase context (with timeout — GitHub API can hang)
    await progressCallback.onPhaseUpdate('analyzing', 20);

    const codebaseContext = await this.withTimeout(
      this.buildCodebaseContext(aec),
      60_000, // 60s timeout for GitHub API calls
      `Codebase analysis timed out for ${aec.repositoryContext?.repositoryFullName || 'unknown repo'}`,
    ).catch((err) => {
      this.logger.warn(`Codebase context failed, using minimal: ${err instanceof Error ? err.message : String(err)}`);
      return this.createMinimalContext();
    });

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

    // Create a scoped progress callback for the LLM call.
    // Maps the LLM's internal 0-100% range into the overall 40-90% range
    // so the progress bar advances smoothly without jumping backwards.
    const llmProgressCallback: GenerationProgressCallback = {
      onPhaseUpdate: async (phase: string, percent: number): Promise<void> => {
        const mappedPercent = 40 + Math.round((percent / 100) * 50);
        await progressCallback.onPhaseUpdate(phase, Math.min(mappedPercent, 90));
      },
      isCancelled: progressCallback.isCancelled,
    };

    // Wrap the LLM call with a timeout to prevent infinite hangs
    const techSpec = await this.withTimeout(
      this.techSpecGenerator.generateWithAnswers({
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
      }, llmProgressCallback),
      LLM_TIMEOUT_MS,
      `LLM generation timed out after ${LLM_TIMEOUT_MS / 1000}s for ticket ${aecId}`,
    );

    // Check cancellation after expensive LLM call
    if (await progressCallback.isCancelled()) return;

    // Phase 6: Save results
    await progressCallback.onPhaseUpdate('saving', 90);

    aec.setTechSpec(techSpec);
    await this.aecRepository.save(aec);

    // HTML wireframe generation (fire-and-forget) — only when user opted in
    this.logger.log(`[HTML Wireframe Check] includeHtmlWireframes=${aec.includeHtmlWireframes}, includeWireframes=${aec.includeWireframes}, expectations=${techSpec.visualExpectations?.expectations?.length ?? 0}`);
    if (aec.includeHtmlWireframes && aec.includeWireframes && techSpec.visualExpectations?.expectations?.length) {
      const asciiWireframes = techSpec.visualExpectations.expectations
        .filter((e: any) => e.wireframe)
        .map((e: any) => `## ${e.screen} (${e.state})\n${e.wireframe}`)
        .join('\n\n');

      if (asciiWireframes) {
        const solutionContext = typeof techSpec.solution === 'object' && techSpec.solution !== null
          ? JSON.stringify(techSpec.solution)
          : String(techSpec.solution ?? '');

        this.techSpecGenerator
          .generateHtmlWireframe(techSpec.title, asciiWireframes, solutionContext, {
            userId: aec.createdBy,
            teamId: aec.teamId,
            ticketId: aec.id,
          }, { designTokens: techSpec.designTokens, stack: techSpec.stack })
          .then(async (html) => {
            if (!html) return;
            const freshAec = await this.aecRepository.findById(aecId);
            if (!freshAec?.techSpec) return;
            freshAec.setTechSpec({ ...freshAec.techSpec, wireframeHtml: html });
            await this.aecRepository.save(freshAec);
            this.logger.log(`HTML wireframe saved for ticket ${aecId} (${html.length} chars)`);
          })
          .catch((error) => {
            this.logger.warn(`HTML wireframe generation failed for ${aecId}: ${error instanceof Error ? error.message : String(error)}`);
          });
      }
    }

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
   * Resolve the team's GitHub OAuth token from Firestore.
   * Background jobs have no HTTP request context, so we look up the
   * encrypted token from the GitHubIntegration entity for this workspace.
   */
  private async resolveGitHubToken(teamId: string): Promise<string | null> {
    try {
      // Derive workspace ID from teamId (same logic as WorkspaceGuard)
      const workspaceId = `ws_team_${teamId.substring(5, 17)}`;
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(workspaceId);
      if (!integration) {
        this.logger.warn(`No GitHub integration found for workspace ${workspaceId}`);
        return null;
      }

      const token = await this.githubTokenService.decryptToken(integration.encryptedAccessToken);
      this.logger.log(`Resolved GitHub OAuth token for workspace ${workspaceId}`);
      return token;
    } catch (error) {
      this.logger.warn(`Failed to resolve GitHub token: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Build codebase context from AEC repository context.
   * Uses the team's OAuth token for GitHub API access (not the static env var).
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

      // Resolve the team's OAuth token for authenticated GitHub access
      const token = await this.resolveGitHubToken(aec.teamId);

      if (token) {
        // Use the team's OAuth token via ad-hoc Octokit (bypasses singleton)
        const octokit = new Octokit({ auth: token });

        const treeResponse = await octokit.git.getTree({
          owner, repo, tree_sha: repoContext.branchName, recursive: '1',
        });
        const fileTree = {
          sha: treeResponse.data.sha,
          url: treeResponse.data.url,
          tree: treeResponse.data.tree as any[],
          truncated: treeResponse.data.truncated || false,
        };

        const filesMap = new Map<string, string>();
        const keyFiles = ['package.json', 'tsconfig.json', 'requirements.txt', 'Dockerfile', 'pom.xml'];

        for (const fileName of keyFiles) {
          try {
            const fileResponse = await octokit.repos.getContent({
              owner, repo, path: fileName, ref: repoContext.branchName,
            });
            if ('content' in fileResponse.data && fileResponse.data.content) {
              filesMap.set(fileName, Buffer.from(fileResponse.data.content, 'base64').toString('utf-8'));
            }
          } catch {
            // File may not exist — expected
          }
        }

        const stack = await this.stackDetector.detectStack(filesMap);
        const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

        this.logger.log(`Repository context built with OAuth token (framework: ${stack.framework?.name || 'unknown'})`);

        return { stack, analysis, fileTree, files: filesMap, taskAnalysis: aec.taskAnalysis };
      }

      // Fallback: try the singleton GitHubFileService (uses static GITHUB_TOKEN env var)
      this.logger.warn('No OAuth token resolved, trying static GITHUB_TOKEN...');

      const fileTree = await this.githubFileService.getTree(owner, repo, repoContext.branchName);
      const filesMap = new Map<string, string>();
      const keyFiles = ['package.json', 'tsconfig.json', 'requirements.txt', 'Dockerfile', 'pom.xml'];

      for (const fileName of keyFiles) {
        try {
          const content = await this.githubFileService.readFile(owner, repo, fileName, repoContext.branchName);
          filesMap.set(fileName, content);
        } catch {
          // File may not exist — expected
        }
      }

      const stack = await this.stackDetector.detectStack(filesMap);
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      this.logger.log(`Repository context built with static token (framework: ${stack.framework?.name || 'unknown'})`);
      return { stack, analysis, fileTree, files: filesMap, taskAnalysis: aec.taskAnalysis };
    } catch (error) {
      this.logger.error(`Error building context: ${error instanceof Error ? error.message : String(error)}`);
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

  /**
   * Wrap a promise with a timeout. Rejects with the given message if the
   * promise does not settle within `ms` milliseconds.
   */
  private withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), ms);
      promise
        .then((val) => { clearTimeout(timer); resolve(val); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
