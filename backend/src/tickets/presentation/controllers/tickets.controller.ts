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
} from '@nestjs/common';
import { CreateTicketUseCase } from '../../application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from '../../application/use-cases/UpdateAECUseCase';
import { DeleteAECUseCase } from '../../application/use-cases/DeleteAECUseCase';
import { StartQuestionRoundUseCase } from '../../application/use-cases/StartQuestionRoundUseCase';
import { SubmitAnswersUseCase } from '../../application/use-cases/SubmitAnswersUseCase';
import { SkipToFinalizeUseCase } from '../../application/use-cases/SkipToFinalizeUseCase';
import { FinalizeSpecUseCase } from '../../application/use-cases/FinalizeSpecUseCase';
import { CreateTicketDto } from '../dto/CreateTicketDto';
import { UpdateAECDto } from '../dto/UpdateAECDto';
import { StartRoundDto } from '../dto/StartRoundDto';
import { SubmitAnswersDto } from '../dto/SubmitAnswersDto';
import { AnalyzeRepositoryDto } from '../dto/AnalyzeRepositoryDto';
import { AECRepository, AEC_REPOSITORY } from '../../application/ports/AECRepository';
import { CODEBASE_ANALYZER } from '../../application/ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../../application/ports/ProjectStackDetectorPort';
import { CodebaseAnalyzer } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '@tickets/domain/stack-detection/ProjectStackDetector';
import { Inject, BadRequestException } from '@nestjs/common';
import { TestAuthGuard } from '../../../shared/presentation/guards/TestAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';
import { GitHubFileService } from '@github/domain/github-file.service';
import { GITHUB_FILE_SERVICE } from '../../application/ports/GitHubFileServicePort';
import { GitHubIntegrationRepository, GITHUB_INTEGRATION_REPOSITORY } from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import { Octokit } from '@octokit/rest';

@Controller('tickets')
@UseGuards(TestAuthGuard, WorkspaceGuard) // Using TestAuthGuard for E2E testing
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly updateAECUseCase: UpdateAECUseCase,
    private readonly deleteAECUseCase: DeleteAECUseCase,
    private readonly startQuestionRoundUseCase: StartQuestionRoundUseCase,
    private readonly submitAnswersUseCase: SubmitAnswersUseCase,
    private readonly skipToFinalizeUseCase: SkipToFinalizeUseCase,
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
  ) {}

  /**
   * Analyze repository without creating a ticket
   * Called in Stage 2 of the wizard to show user the detected stack and patterns
   * before they decide to proceed with ticket creation
   */
  @Post('analyze-repo')
  async analyzeRepository(
    @WorkspaceId() workspaceId: string,
    @Body() dto: AnalyzeRepositoryDto,
  ) {
    this.logger.log(`🔍 Analyzing repository: ${dto.owner}/${dto.repo} (branch: ${dto.branch || 'main'})`);

    try {
      // Fetch user's GitHub token from integration
      this.logger.log(`📦 Fetching GitHub integration for workspace: ${workspaceId}`);
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(workspaceId);

      if (!integration) {
        throw new BadRequestException('GitHub not connected. Please connect GitHub in Settings first.');
      }

      // Decrypt token
      const accessToken = await this.githubTokenService.decryptToken(integration.encryptedAccessToken);

      // Create authenticated Octokit client with user's token
      const octokit = new Octokit({ auth: accessToken });

      const branch = dto.branch || 'main';

      // Fetch repository file tree using authenticated client
      this.logger.log(`🌳 Fetching repository tree from branch: ${branch}...`);

      // First, get the tree SHA for the branch
      const refResponse = await octokit.rest.git.getRef({
        owner: dto.owner,
        repo: dto.repo,
        ref: `heads/${branch}`,
      });

      const treeSha = refResponse.data.object.sha;

      // Then get the tree
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

      // Read key files for analysis
      this.logger.log(`📄 Reading key repository files...`);
      const filesToRead = [
        'package.json',
        'tsconfig.json',
        '.eslintrc.json',
        '.prettierrc',
        'README.md',
      ];

      const files = new Map<string, string>();
      for (const filePath of filesToRead) {
        try {
          const response = await octokit.rest.repos.getContent({
            owner: dto.owner,
            repo: dto.repo,
            path: filePath,
            ref: branch,
          });

          // response.data.content is base64 encoded
          if ('content' in response.data && typeof response.data.content === 'string') {
            const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
            files.set(filePath, content);
          }
        } catch {
          // File not found, skip it
        }
      }

      // Detect technology stack
      this.logger.log(`🔍 Detecting technology stack...`);
      const stack = await this.projectStackDetector.detectStack(files);

      // Analyze codebase patterns
      this.logger.log(`🔧 Analyzing codebase patterns...`);
      const analysis = await this.codebaseAnalyzer.analyzeStructure(files, fileTree);

      // Extract important files (up to 20)
      const filesList = fileTree.tree
        .filter(
          (f: any) =>
            f.type === 'blob' &&
            (f.path.endsWith('.ts') ||
              f.path.endsWith('.tsx') ||
              f.path.endsWith('.js') ||
              f.path.endsWith('.json') ||
              f.path.endsWith('.md')),
        )
        .slice(0, 20)
        .map((f: any) => ({
          path: f.path,
          name: f.path.split('/').pop(),
          isDirectory: false,
        }));

      const context = {
        stack,
        analysis,
        files: filesList,
      };

      this.logger.log(`✅ Repository analysis complete`);
      return { context };
    } catch (error: any) {
      this.logger.error(
        `❌ Repository analysis failed: ${error.message}`,
      );

      if (error.status === 404 || error.message.includes('not found')) {
        throw new BadRequestException(
          `Repository ${dto.owner}/${dto.repo} not found or not accessible`,
        );
      }

      throw new BadRequestException(
        `Failed to analyze repository: ${error.message}`,
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateTicketDto,
  ) {
    const aec = await this.createTicketUseCase.execute({
      workspaceId,
      title: dto.title,
      description: dto.description,
      repositoryFullName: dto.repositoryFullName,
      branchName: dto.branchName,
    });

    return this.mapToResponse(aec);
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
    const aec = await this.updateAECUseCase.execute({
      aecId: id,
      acceptanceCriteria: dto.acceptanceCriteria,
      assumptions: dto.assumptions,
    });

    return this.mapToResponse(aec);
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
   * Skip remaining rounds - user manual override to finalize immediately
   */
  @Post(':id/skip-to-finalize')
  async skipToFinalize(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const aec = await this.skipToFinalizeUseCase.execute({
      aecId: id,
      workspaceId,
    });

    return this.mapToResponse(aec);
  }

  /**
   * Finalize spec - generate final technical specification with all answers
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
      createdAt: aec.createdAt,
      updatedAt: aec.updatedAt,
    };
  }
}
