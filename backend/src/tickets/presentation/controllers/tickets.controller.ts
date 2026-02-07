import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateTicketUseCase, TICKET_LIMITS, DEFAULT_TICKET_LIMIT } from '../../application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from '../../application/use-cases/UpdateAECUseCase';
import { DeleteAECUseCase } from '../../application/use-cases/DeleteAECUseCase';
import { StartQuestionRoundUseCase } from '../../application/use-cases/StartQuestionRoundUseCase';
import { SubmitAnswersUseCase } from '../../application/use-cases/SubmitAnswersUseCase';
import { GenerateQuestionsUseCase } from '../../application/use-cases/GenerateQuestionsUseCase';
import { SubmitQuestionAnswersUseCase } from '../../application/use-cases/SubmitQuestionAnswersUseCase';
import { FinalizeSpecUseCase } from '../../application/use-cases/FinalizeSpecUseCase';
import { CreateTicketDto } from '../dto/CreateTicketDto';
import { UpdateAECDto } from '../dto/UpdateAECDto';
import { StartRoundDto } from '../dto/StartRoundDto';
import { SubmitAnswersDto } from '../dto/SubmitAnswersDto';
import { AnalyzeRepositoryDto } from '../dto/AnalyzeRepositoryDto';
import { AECRepository, AEC_REPOSITORY } from '../../application/ports/AECRepository';
import { InvalidStateTransitionError, QuotaExceededError } from '../../../shared/domain/exceptions/DomainExceptions';
import { CODEBASE_ANALYZER } from '../../application/ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../../application/ports/ProjectStackDetectorPort';
import { CodebaseAnalyzer } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '@tickets/domain/stack-detection/ProjectStackDetector';
import { Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';
import { UserEmail } from '../../../shared/presentation/decorators/UserEmail.decorator';
import { GitHubFileService } from '@github/domain/github-file.service';
import { GITHUB_FILE_SERVICE } from '../../application/ports/GitHubFileServicePort';
import { GitHubIntegrationRepository, GITHUB_INTEGRATION_REPOSITORY } from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import { Octokit } from '@octokit/rest';
import { DEEP_ANALYSIS_SERVICE } from '../../application/ports/DeepAnalysisServicePort';
import { DeepAnalysisService } from '@tickets/domain/deep-analysis/deep-analysis.service';

@Controller('tickets')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly updateAECUseCase: UpdateAECUseCase,
    private readonly deleteAECUseCase: DeleteAECUseCase,
    private readonly startQuestionRoundUseCase: StartQuestionRoundUseCase,
    private readonly submitAnswersUseCase: SubmitAnswersUseCase,
    private readonly generateQuestionsUseCase: GenerateQuestionsUseCase,
    private readonly submitQuestionAnswersUseCase: SubmitQuestionAnswersUseCase,
    private readonly finalizeSpecUseCase: FinalizeSpecUseCase,
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(GITHUB_FILE_SERVICE)
    private readonly gitHubFileService: GitHubFileService,
    @Inject(CODEBASE_ANALYZER)
    private readonly codebaseAnalyzer: CodebaseAnalyzer,
    @Inject(PROJECT_STACK_DETECTOR)
    private readonly projectStackDetector: ProjectStackDetector,
    @Inject(GITHUB_INTEGRATION_REPOSITORY)
    private readonly githubIntegrationRepository: GitHubIntegrationRepository,
    private readonly githubTokenService: GitHubTokenService,
    @Inject(DEEP_ANALYSIS_SERVICE)
    private readonly deepAnalysisService: DeepAnalysisService,
  ) {}

  /**
   * Analyze repository without creating a ticket.
   * Streams SSE progress events so the frontend can show real-time progress.
   *
   * Guards (FirebaseAuthGuard, WorkspaceGuard) and ValidationPipe still run
   * before this handler executes. Using @Res() bypasses NestJS interceptors
   * for the response only — that's fine because we're writing SSE directly.
   */
  @Post('analyze-repo')
  async analyzeRepository(
    @WorkspaceId() workspaceId: string,
    @Body() dto: AnalyzeRepositoryDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Analyzing repository: ${dto.owner}/${dto.repo} (branch: ${dto.branch || 'main'}) — "${dto.title}"`);

    // Set SSE headers and start streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: Record<string, any>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // 1. Auth: fetch integration, decrypt token, create Octokit
      send({ phase: 'connecting', message: 'Connecting to GitHub...', percent: 5 });

      const integration = await this.githubIntegrationRepository.findByWorkspaceId(workspaceId);
      if (!integration) {
        throw new BadRequestException('GitHub not connected. Please connect GitHub in Settings first.');
      }

      const accessToken = await this.githubTokenService.decryptToken(integration.encryptedAccessToken);
      const octokit = new Octokit({ auth: accessToken });
      const branch = dto.branch || 'main';

      // 2. Tree: fetch recursive tree
      send({ phase: 'fetching_tree', message: 'Fetching repository structure...', percent: 15 });

      const refResponse = await octokit.rest.git.getRef({
        owner: dto.owner,
        repo: dto.repo,
        ref: `heads/${branch}`,
      });

      const treeSha = refResponse.data.object.sha;

      const treeResponse = await octokit.rest.git.getTree({
        owner: dto.owner,
        repo: dto.repo,
        tree_sha: treeSha,
        recursive: '1' as any,
      });

      const fileTree = {
        sha: treeResponse.data.sha,
        url: treeResponse.data.url,
        tree: (treeResponse.data.tree || []).map((entry: any) => ({
          path: entry.path!,
          mode: entry.mode!,
          type: entry.type as 'blob' | 'tree',
          sha: entry.sha!,
          size: entry.size,
          url: entry.url!,
        })),
        truncated: treeResponse.data.truncated || false,
      };

      // 3. Config read: read key config files
      send({ phase: 'reading_configs', message: 'Reading configuration files...', percent: 25 });

      const configFilePaths = [
        'package.json',
        'tsconfig.json',
        '.eslintrc.json',
        '.prettierrc',
        'README.md',
      ];

      const configFiles = new Map<string, string>();
      for (const filePath of configFilePaths) {
        try {
          const response = await octokit.rest.repos.getContent({
            owner: dto.owner,
            repo: dto.repo,
            path: filePath,
            ref: branch,
          });

          if ('content' in response.data && typeof response.data.content === 'string') {
            const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
            configFiles.set(filePath, content);
          }
        } catch {
          // File not found, skip
        }
      }

      // 4. Deep LLM analysis — service emits progress at 35%, 50%, 65%
      this.logger.log(`Starting deep LLM analysis...`);
      const result = await this.deepAnalysisService.analyze({
        title: dto.title,
        description: dto.description,
        owner: dto.owner,
        repo: dto.repo,
        branch,
        fileTree,
        configFiles,
        octokit,
        onProgress: (event) => send(event),
      });

      this.logger.log(`Repository analysis complete`);

      // Final complete event with result payload
      send({ phase: 'complete', message: 'Analysis complete', percent: 100, result: { context: result } });
      res.end();
    } catch (error: any) {
      this.logger.error(`Repository analysis failed: ${error.message}`);

      const errorMessage = error.status === 404 && !error.message?.includes('LLM')
        ? `Repository ${dto.owner}/${dto.repo} not found or not accessible`
        : `Failed to analyze repository: ${error.message}`;

      send({ phase: 'error', message: errorMessage, percent: 0 });
      res.end();
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @WorkspaceId() workspaceId: string,
    @UserEmail() userEmail: string,
    @Body() dto: CreateTicketDto,
  ) {
    try {
      const aec = await this.createTicketUseCase.execute({
        workspaceId,
        userEmail,
        title: dto.title,
        description: dto.description,
        repositoryFullName: dto.repositoryFullName,
        branchName: dto.branchName,
        maxRounds: dto.maxRounds,
        type: dto.type,
        priority: dto.priority,
      });

      return this.mapToResponse(aec);
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @Get('quota')
  async getQuota(
    @WorkspaceId() workspaceId: string,
    @UserEmail() userEmail: string,
  ) {
    const limit = TICKET_LIMITS[userEmail] ?? DEFAULT_TICKET_LIMIT;
    const used = await this.aecRepository.countByWorkspace(workspaceId);
    return { used, limit, canCreate: used < limit };
  }

  @Get(':id')
  async getTicket(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const aec = await this.aecRepository.findById(id);
    if (!aec) {
      throw new Error('AEC not found');
    }

    // Verify AEC belongs to user's workspace
    if (aec.workspaceId !== workspaceId) {
      throw new Error('AEC not found'); // Don't reveal it exists in another workspace
    }

    return this.mapToResponse(aec);
  }

  @Get()
  async listTickets(@WorkspaceId() workspaceId: string) {
    const aecs = await this.aecRepository.findByWorkspace(workspaceId);
    return aecs.map((aec) => this.mapToResponse(aec));
  }

  @Patch(':id')
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateAECDto) {
    try {
      const aec = await this.updateAECUseCase.execute({
        aecId: id,
        description: dto.description,
        acceptanceCriteria: dto.acceptanceCriteria,
        assumptions: dto.assumptions,
        status: dto.status,
        techSpec: dto.techSpec,
      });

      return this.mapToResponse(aec);
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.deleteAECUseCase.execute(id, workspaceId);
  }

  /**
   * Start a question round - triggers initial or iterative question generation
   */
  @Post(':id/start-round')
  async startQuestionRound(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: StartRoundDto,
  ) {
    const aec = await this.startQuestionRoundUseCase.execute({
      aecId: id,
      workspaceId,
      roundNumber: dto.roundNumber,
    });

    return this.mapToResponse(aec);
  }

  /**
   * Submit answers to current round - records answers and decides next action
   */
  @Post(':id/submit-answers')
  async submitAnswers(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
  ) {
    const result = await this.submitAnswersUseCase.execute({
      aecId: id,
      workspaceId,
      roundNumber: dto.roundNumber,
      answers: dto.answers || {},
    });

    return {
      aec: this.mapToResponse(result.aec),
      nextAction: result.nextAction,
    };
  }

  /**
   * Generate clarification questions (simplified single-call flow)
   */
  @Post(':id/generate-questions')
  async generateQuestions(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const questions = await this.generateQuestionsUseCase.execute({
      aecId: id,
      workspaceId,
    });

    return { questions };
  }

  /**
   * Submit question answers and finalize technical specification
   */
  @Post(':id/submit-answers')
  async submitQuestionAnswers(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
  ) {
    const aec = await this.submitQuestionAnswersUseCase.execute({
      aecId: id,
      workspaceId,
      answers: dto.answers ?? {},
    });

    return this.mapToResponse(aec);
  }

  /**
   * Finalize spec - generate final technical specification (deprecated, use /submit-answers)
   */
  @Post(':id/finalize')
  async finalizeSpec(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const aec = await this.finalizeSpecUseCase.execute({
      aecId: id,
      workspaceId,
    });

    return this.mapToResponse(aec);
  }

  private mapToResponse(aec: any) {
    return {
      id: aec.id,
      workspaceId: aec.workspaceId,
      status: aec.status,
      title: aec.title,
      description: aec.description,
      type: aec.type,
      priority: aec.priority,
      readinessScore: aec.readinessScore,
      generationState: aec.generationState,
      acceptanceCriteria: aec.acceptanceCriteria,
      assumptions: aec.assumptions,
      repoPaths: aec.repoPaths,
      codeSnapshot: aec.codeSnapshot,
      apiSnapshot: aec.apiSnapshot,
      questions: aec.questions,
      estimate: aec.estimate,
      validationResults: aec.validationResults.map((vr: any) => vr.toPlainObject()),
      externalIssue: aec.externalIssue,
      driftDetectedAt: aec.driftDetectedAt,
      repositoryContext: aec.repositoryContext
        ? {
            repositoryFullName: aec.repositoryContext.repositoryFullName,
            branchName: aec.repositoryContext.branchName,
            commitSha: aec.repositoryContext.commitSha,
            isDefaultBranch: aec.repositoryContext.isDefaultBranch,
            selectedAt: aec.repositoryContext.selectedAt,
          }
        : null,
      // Iterative refinement workflow fields
      questionRounds: aec.questionRounds,
      currentRound: aec.currentRound,
      techSpec: aec.techSpec,
      maxRounds: aec.maxRounds,
      createdAt: aec.createdAt,
      updatedAt: aec.updatedAt,
    };
  }
}
