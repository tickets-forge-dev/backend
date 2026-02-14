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
  UseInterceptors,
  UploadedFile,
  Logger,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import {
  CreateTicketUseCase,
  TICKET_LIMITS,
  DEFAULT_TICKET_LIMIT,
} from '../../application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from '../../application/use-cases/UpdateAECUseCase';
import { DeleteAECUseCase } from '../../application/use-cases/DeleteAECUseCase';
import { GenerateQuestionsUseCase } from '../../application/use-cases/GenerateQuestionsUseCase';
import { SubmitQuestionAnswersUseCase } from '../../application/use-cases/SubmitQuestionAnswersUseCase';
import { FinalizeSpecUseCase } from '../../application/use-cases/FinalizeSpecUseCase';
import { CreateTicketDto } from '../dto/CreateTicketDto';
import { UpdateAECDto } from '../dto/UpdateAECDto';
import { SubmitAnswersDto } from '../dto/SubmitAnswersDto';
import { AnalyzeRepositoryDto } from '../dto/AnalyzeRepositoryDto';
import { AECRepository, AEC_REPOSITORY } from '../../application/ports/AECRepository';
import {
  InvalidStateTransitionError,
  QuotaExceededError,
} from '../../../shared/domain/exceptions/DomainExceptions';
import { CODEBASE_ANALYZER } from '../../application/ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../../application/ports/ProjectStackDetectorPort';
import { CodebaseAnalyzer } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '@tickets/domain/stack-detection/ProjectStackDetector';
import { Inject, BadRequestException, ForbiddenException, Req } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';
import { UserEmail } from '../../../shared/presentation/decorators/UserEmail.decorator';
import { UserId } from '../../../shared/presentation/decorators/UserId.decorator';
import { TelemetryService } from '../../../shared/infrastructure/posthog/telemetry.service';
import { GitHubFileService } from '@github/domain/github-file.service';
import { GITHUB_FILE_SERVICE } from '../../application/ports/GitHubFileServicePort';
import {
  GitHubIntegrationRepository,
  GITHUB_INTEGRATION_REPOSITORY,
} from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import { Octokit } from '@octokit/rest';
import { DEEP_ANALYSIS_SERVICE } from '../../application/ports/DeepAnalysisServicePort';
import { DeepAnalysisService } from '@tickets/domain/deep-analysis/deep-analysis.service';
import { ApiDetectionService } from '../../application/services/ApiDetectionService';
import { TechSpecMarkdownGenerator } from '../../application/services/TechSpecMarkdownGenerator';
import { AecXmlSerializer } from '../../application/services/AecXmlSerializer';
import { AttachmentStorageService } from '../../infrastructure/storage/AttachmentStorageService';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_ATTACHMENTS } from '../../domain/value-objects/Attachment';
import { ExportToLinearUseCase } from '../../application/use-cases/ExportToLinearUseCase';
import { ExportToJiraUseCase } from '../../application/use-cases/ExportToJiraUseCase';
import { GetImportAvailabilityUseCase } from '../../application/use-cases/GetImportAvailabilityUseCase';
import { ImportFromJiraUseCase } from '../../application/use-cases/ImportFromJiraUseCase';
import { ImportFromLinearUseCase } from '../../application/use-cases/ImportFromLinearUseCase';
import { PRDBreakdownUseCase } from '../../application/use-cases/PRDBreakdownUseCase';
import { BulkCreateFromBreakdownUseCase } from '../../application/use-cases/BulkCreateFromBreakdownUseCase';
import { EnrichMultipleTicketsUseCase } from '../../application/use-cases/EnrichMultipleTicketsUseCase';
import { FinalizeMultipleTicketsUseCase } from '../../application/use-cases/FinalizeMultipleTicketsUseCase';
import { AddDesignReferenceUseCase } from '../../application/use-cases/AddDesignReferenceUseCase';
import { RemoveDesignReferenceUseCase } from '../../application/use-cases/RemoveDesignReferenceUseCase';
import { RefreshDesignMetadataUseCase } from '../../application/use-cases/RefreshDesignMetadataUseCase';
import { ImportFromJiraDto } from '../dto/ImportFromJiraDto';
import { AddDesignReferenceDto } from '../dto/AddDesignReferenceDto';
import { ImportFromLinearDto } from '../dto/ImportFromLinearDto';
import { BulkEnrichDto } from '../dto/BulkEnrichDto';
import { BulkFinalizeDto } from '../dto/BulkFinalizeDto';
import {
  PRDBreakdownRequestDto,
  BulkCreateFromBreakdownRequestDto,
  BulkCreateFromBreakdownResponseDto,
} from '../dto/PRDBreakdownDto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

@Controller('tickets')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly updateAECUseCase: UpdateAECUseCase,
    private readonly deleteAECUseCase: DeleteAECUseCase,
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
    private readonly apiDetectionService: ApiDetectionService,
    private readonly techSpecMarkdownGenerator: TechSpecMarkdownGenerator,
    private readonly aecXmlSerializer: AecXmlSerializer,
    private readonly attachmentStorageService: AttachmentStorageService,
    private readonly exportToLinearUseCase: ExportToLinearUseCase,
    private readonly exportToJiraUseCase: ExportToJiraUseCase,
    private readonly getImportAvailabilityUseCase: GetImportAvailabilityUseCase,
    private readonly importFromJiraUseCase: ImportFromJiraUseCase,
    private readonly importFromLinearUseCase: ImportFromLinearUseCase,
    private readonly prdBreakdownUseCase: PRDBreakdownUseCase,
    private readonly bulkCreateFromBreakdownUseCase: BulkCreateFromBreakdownUseCase,
    private readonly enrichMultipleTicketsUseCase: EnrichMultipleTicketsUseCase,
    private readonly finalizeMultipleTicketsUseCase: FinalizeMultipleTicketsUseCase,
    private readonly addDesignReferenceUseCase: AddDesignReferenceUseCase,
    private readonly removeDesignReferenceUseCase: RemoveDesignReferenceUseCase,
    private readonly refreshDesignMetadataUseCase: RefreshDesignMetadataUseCase,
    private readonly telemetry: TelemetryService,
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
    this.logger.log(
      `Analyzing repository: ${dto.owner}/${dto.repo} (branch: ${dto.branch || 'main'}) — "${dto.title}"`,
    );

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
        throw new BadRequestException(
          'GitHub not connected. Please connect GitHub in Settings first.',
        );
      }

      const accessToken = await this.githubTokenService.decryptToken(
        integration.encryptedAccessToken,
      );
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
      send({
        phase: 'complete',
        message: 'Analysis complete',
        percent: 100,
        result: { context: result },
      });
      res.end();
    } catch (error: any) {
      this.logger.error(`Repository analysis failed: ${error.message}`);

      const errorMessage =
        error.status === 404 && !error.message?.includes('LLM')
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
    @UserId() userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    try {
      this.telemetry.trackTicketCreationStarted(userId, workspaceId, 'create_new');

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
        taskAnalysis: dto.taskAnalysis,
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
  async getQuota(@WorkspaceId() workspaceId: string, @UserEmail() userEmail: string) {
    const limit = TICKET_LIMITS[userEmail] ?? DEFAULT_TICKET_LIMIT;
    const used = await this.aecRepository.countByWorkspace(workspaceId);
    return { used, limit, canCreate: used < limit };
  }

  @Get(':id(aec_[a-f0-9\\-]+)')
  async getTicket(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
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
  async deleteTicket(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    await this.deleteAECUseCase.execute(id, workspaceId);
  }

  /**
   * Generate clarification questions (simplified single-call flow)
   */
  @Post(':id(aec_[a-f0-9\\-]+)/generate-questions')
  async generateQuestions(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @UserId() userId: string,
  ) {
    const questions = await this.generateQuestionsUseCase.execute({
      aecId: id,
      workspaceId,
    });

    this.telemetry.trackQuestionsGenerated(userId, id, questions.length);

    return { questions };
  }

  /**
   * Submit question answers and finalize technical specification
   */
  @Post(':id(aec_[a-f0-9\\-]+)/submit-answers')
  async submitQuestionAnswers(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @UserId() userId: string,
    @Body() dto: SubmitAnswersDto,
  ) {
    const aec = await this.submitQuestionAnswersUseCase.execute({
      aecId: id,
      workspaceId,
      answers: dto.answers ?? {},
    });

    // Track spec finalization after answers are submitted
    if (aec.techSpec) {
      this.telemetry.trackSpecGenerated(
        userId,
        id,
        aec.techSpec.qualityScore ?? 0,
        0, // Duration not tracked at controller level, could be added to domain
      );

      this.telemetry.trackTicketFinalized(
        userId,
        id,
        0, // Total duration not tracked, would need to store creation time
        0, // Total cost not tracked at this level
      );
    }

    return this.mapToResponse(aec);
  }

  /**
   * Finalize spec - generate final technical specification (deprecated, use /submit-answers)
   */
  @Post(':id(aec_[a-f0-9\\-]+)/finalize')
  async finalizeSpec(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    const aec = await this.finalizeSpecUseCase.execute({
      aecId: id,
      workspaceId,
    });

    return this.mapToResponse(aec);
  }

  /**
   * Export ticket as Markdown tech spec document.
   * Uses @Res() for custom Content-Type, so we manually handle errors.
   */
  @Get(':id(aec_[a-f0-9\\-]+)/export/markdown')
  async exportMarkdown(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const aec = await this.aecRepository.findById(id);
      if (!aec || aec.workspaceId !== workspaceId) {
        res.status(400).json({ message: 'Ticket not found' });
        return;
      }
      if (!aec.techSpec) {
        res.status(400).json({ message: 'Ticket has no tech spec. Generate a spec first.' });
        return;
      }

      const markdown = this.techSpecMarkdownGenerator.generate(aec);
      const filename = `${(aec.title || 'ticket').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase()}-spec.md`;

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(markdown);
    } catch (error: any) {
      this.logger.error(`Export markdown failed: ${error.message}`);
      res.status(500).json({ message: 'Failed to export markdown' });
    }
  }

  /**
   * Export ticket as AEC XML contract.
   * Uses @Res() for custom Content-Type, so we manually handle errors.
   */
  @Get(':id(aec_[a-f0-9\\-]+)/export/xml')
  async exportXml(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const aec = await this.aecRepository.findById(id);
      if (!aec || aec.workspaceId !== workspaceId) {
        res.status(400).json({ message: 'Ticket not found' });
        return;
      }
      if (!aec.techSpec) {
        res.status(400).json({ message: 'Ticket has no tech spec. Generate a spec first.' });
        return;
      }

      const xml = this.aecXmlSerializer.serialize(aec);
      const filename = `${(aec.title || 'ticket').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase()}-aec.xml`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(xml);
    } catch (error: any) {
      this.logger.error(`Export XML failed: ${error.message}`);
      res.status(500).json({ message: 'Failed to export XML' });
    }
  }

  /**
   * Detect APIs from the ticket's repository by scanning controller files.
   * Resolves per-user GitHub token (same pattern as analyzeRepository).
   */
  @Post(':id(aec_[a-f0-9\\-]+)/detect-apis')
  async detectApis(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    const aec = await this.aecRepository.findById(id);
    if (!aec || aec.workspaceId !== workspaceId) {
      throw new BadRequestException('Ticket not found');
    }

    const repoContext = aec.repositoryContext;
    if (!repoContext?.repositoryFullName) {
      throw new BadRequestException('No repository linked to this ticket');
    }

    const [owner, repo] = repoContext.repositoryFullName.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository name');
    }

    const branch = repoContext.branchName || 'main';

    try {
      // Resolve per-user GitHub token (same as analyzeRepository)
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(workspaceId);
      if (!integration) {
        throw new BadRequestException(
          'GitHub not connected. Please connect GitHub in Settings first.',
        );
      }

      const accessToken = await this.githubTokenService.decryptToken(
        integration.encryptedAccessToken,
      );
      const octokit = new Octokit({ auth: accessToken });

      // Fetch tree and find controller files
      const refResponse = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const treeResponse = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: refResponse.data.object.sha,
        recursive: '1' as any,
      });

      const controllerPaths = (treeResponse.data.tree || [])
        .filter(
          (entry: any) =>
            entry.type === 'blob' &&
            (entry.path.endsWith('.controller.ts') ||
              entry.path.endsWith('.controller.js') ||
              entry.path.includes('/controllers/') ||
              entry.path.includes('/routes/')),
        )
        .map((entry: any) => entry.path);

      // Read controller files
      const fileContents = new Map<string, string>();
      for (const filePath of controllerPaths.slice(0, 30)) {
        // cap at 30 files
        try {
          const fileResp = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch,
          });
          if ('content' in fileResp.data && typeof fileResp.data.content === 'string') {
            fileContents.set(
              filePath,
              Buffer.from(fileResp.data.content, 'base64').toString('utf-8'),
            );
          }
        } catch {
          // File unreadable, skip
        }
      }

      // Use existing parser (no extra GitHub calls needed)
      const apis = this.apiDetectionService.detectApisFromFileContents(fileContents);

      return {
        apis,
        count: apis.length,
        repository: repoContext.repositoryFullName,
        branch,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`API detection failed: ${error.message}`);
      throw new BadRequestException(`Failed to scan APIs: ${error.message}`);
    }
  }

  /**
   * Upload a file attachment to a ticket.
   */
  @Post(':id(aec_[a-f0-9\\-]+)/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
  }))
  async uploadAttachment(
    @WorkspaceId() workspaceId: string,
    @UserEmail() userEmail: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException(
        `File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    const aec = await this.aecRepository.findById(id);
    if (!aec || aec.workspaceId !== workspaceId) {
      throw new BadRequestException('Ticket not found');
    }

    if (aec.attachments.length >= MAX_ATTACHMENTS) {
      throw new BadRequestException(`Maximum of ${MAX_ATTACHMENTS} attachments per ticket`);
    }

    try {
      const attachment = await this.attachmentStorageService.upload(
        workspaceId,
        id,
        file,
        userEmail,
      );

      aec.addAttachment(attachment);
      await this.aecRepository.save(aec);

      return attachment;
    } catch (error: any) {
      this.logger.error(`Attachment upload failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a file attachment from a ticket.
   */
  @Delete(':id/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAttachment(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    const aec = await this.aecRepository.findById(id);
    if (!aec || aec.workspaceId !== workspaceId) {
      throw new BadRequestException('Ticket not found');
    }

    const attachment = aec.attachments.find((a) => a.id === attachmentId);
    if (!attachment) {
      throw new BadRequestException('Attachment not found');
    }

    await this.attachmentStorageService.delete(attachment.storagePath);
    aec.removeAttachment(attachmentId);
    await this.aecRepository.save(aec);
  }

  /**
   * List attachments for a ticket.
   */
  @Get(':id(aec_[a-f0-9\\-]+)/attachments')
  async listAttachments(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const aec = await this.aecRepository.findById(id);
    if (!aec || aec.workspaceId !== workspaceId) {
      throw new BadRequestException('Ticket not found');
    }

    return aec.attachments;
  }

  /**
   * Add a design reference (Figma, Loom, etc.) to a ticket.
   *
   * Validates URL, auto-detects platform, stores reference.
   * Phase 2: Metadata fetching happens asynchronously.
   */
  @Post(':id(aec_[a-f0-9\\-]+)/design-references')
  @HttpCode(HttpStatus.CREATED)
  async addDesignReference(
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
    @UserEmail() userEmail: string,
    @Param('id') id: string,
    @Body() dto: AddDesignReferenceDto,
  ) {
    const result = await this.addDesignReferenceUseCase.execute({
      ticketId: id,
      workspaceId,
      userId,
      userEmail,
      url: dto.url,
      title: dto.title,
    });

    return result;
  }

  /**
   * Remove a design reference from a ticket.
   */
  @Delete(':id/design-references/:referenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDesignReference(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Param('referenceId') referenceId: string,
  ) {
    await this.removeDesignReferenceUseCase.execute({
      ticketId: id,
      referenceId,
      workspaceId,
    });
  }

  /**
   * Refresh design reference metadata (thumbnails, tokens, etc.)
   * Manually triggers a re-fetch of metadata from Figma/Loom APIs
   */
  @Post(':id/design-references/:referenceId/refresh')
  async refreshDesignMetadata(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Param('referenceId') referenceId: string,
  ) {
    const result = await this.refreshDesignMetadataUseCase.execute({
      ticketId: id,
      referenceId,
      workspaceId,
    });
    return result;
  }

  /**
   * Export ticket to Linear as an issue.
   */
  @Post(':id(aec_[a-f0-9\\-]+)/export/linear')
  async exportToLinear(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() body: { teamId: string },
  ) {
    try {
      const result = await this.exportToLinearUseCase.execute({
        aecId: id,
        workspaceId,
        teamId: body.teamId,
      });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Export ticket to Jira as an issue.
   */
  @Post(':id(aec_[a-f0-9\\-]+)/export/jira')
  async exportToJira(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() body: { projectKey: string; sections?: string[] },
    @Req() req: any,
  ) {
    const userId = req.user?.uid;
    if (!userId) throw new BadRequestException('Missing user');

    try {
      const result = await this.exportToJiraUseCase.execute({
        aecId: id,
        workspaceId,
        userId,
        projectKey: body.projectKey,
        sections: body.sections,
      });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
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
      attachments: aec.attachments ?? [],
      designReferences: aec.designReferences ?? [],
      createdAt: aec.createdAt,
      updatedAt: aec.updatedAt,
    };
  }

  /**
   * GET /tickets/import/availability
   * Check which platforms are connected and available for import
   */
  @Get('import/availability')
  @HttpCode(HttpStatus.OK)
  async getImportAvailability(
    @WorkspaceId() workspaceId: string,
    @UserEmail() userId: string,
  ) {
    return await this.getImportAvailabilityUseCase.execute({
      workspaceId,
      userId,
    });
  }

  /**
   * POST /tickets/import/jira
   * Import ticket from Jira
   */
  @Post('import/jira')
  @HttpCode(HttpStatus.CREATED)
  async importFromJira(
    @Body() dto: ImportFromJiraDto,
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
  ) {
    try {
      const result = await this.importFromJiraUseCase.execute({
        workspaceId,
        userId,
        issueKey: dto.issueKey,
      });

      this.telemetry.trackJiraIssueImported(userId, dto.issueKey, result.ticketId);
      return result;
    } catch (error: any) {
      if (error.message.includes('not connected')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('No permission')) {
        throw new ForbiddenException(error.message);
      }
      this.logger.error(`Jira import failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to import from Jira');
    }
  }

  /**
   * POST /tickets/import/linear
   * Import ticket from Linear
   */
  @Post('import/linear')
  @HttpCode(HttpStatus.CREATED)
  async importFromLinear(
    @Body() dto: ImportFromLinearDto,
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
  ) {
    try {
      const result = await this.importFromLinearUseCase.execute({
        workspaceId,
        issueId: dto.issueId,
      });

      this.telemetry.trackLinearIssueImported(userId, dto.issueId, result.ticketId);
      return result;
    } catch (error: any) {
      if (error.message.includes('not connected')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('No access') || error.message.includes('No permission')) {
        throw new ForbiddenException(error.message);
      }
      this.logger.error(`Linear import failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to import from Linear');
    }
  }

  /**
   * POST /tickets/breakdown/prd
   * Analyze a PRD and return a breakdown into epics and stories
   *
   * Streams progress events via SSE so frontend can show real-time feedback:
   * - "Extracting functional requirements..."
   * - "Proposing epics..."
   * - "Generating stories..."
   * - Final completion event with breakdown result
   *
   * Request body:
   * {
   *   "prdText": "...",
   *   "repositoryOwner": "user",
   *   "repositoryName": "repo",
   *   "projectName": "My Project" (optional)
   * }
   *
   * Response: SSE stream with progress events, final event contains breakdown
   */
  @Post('breakdown/prd')
  async breakdownPRD(
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
    @Body() dto: PRDBreakdownRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    // Set up SSE headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      this.logger.log(`🔍 PRD breakdown requested for ${dto.repositoryOwner}/${dto.repositoryName}`);

      // Send progress: Starting analysis
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        step: 'extracting',
        message: 'Extracting functional requirements from PRD...',
      })}\n\n`);

      const result = await this.prdBreakdownUseCase.execute({
        prdText: dto.prdText,
        repositoryOwner: dto.repositoryOwner,
        repositoryName: dto.repositoryName,
        projectName: dto.projectName,
        workspaceId,
        onProgress: (step: string, message: string) => {
          // Stream progress events as analysis proceeds
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            step,
            message,
          })}\n\n`);
        },
      });

      this.logger.log(
        `✅ PRD breakdown complete: ${result.estimatedTicketsCount} tickets in ${result.analysisTime}ms`,
      );

      // Send final completion event with breakdown result
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        breakdown: result.breakdown,
        analysisTime: result.analysisTime,
        estimatedTicketsCount: result.estimatedTicketsCount,
      })}\n\n`);

      res.end();
    } catch (error: any) {
      this.logger.error(`PRD breakdown failed: ${error.message}`);
      const errorEvent = {
        type: 'error',
        message: error.message || 'Failed to analyze PRD. Please ensure it contains clear requirements.',
      };
      res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
      res.end();
    }
  }

  /**
   * POST /tickets/breakdown/bulk-create
   * Bulk create draft tickets from a PRD breakdown result
   *
   * Request body: List of breakdown tickets to create
   * Response: Created ticket IDs and any errors
   */
  @Post('breakdown/bulk-create')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateFromBreakdown(
    @WorkspaceId() workspaceId: string,
    @UserEmail() userEmail: string,
    @UserId() userId: string,
    @Body() dto: BulkCreateFromBreakdownRequestDto,
  ): Promise<BulkCreateFromBreakdownResponseDto> {
    try {
      this.logger.log(`📦 Bulk creating ${dto.tickets.length} tickets from PRD breakdown`);

      const result = await this.bulkCreateFromBreakdownUseCase.execute({
        workspaceId,
        userEmail,
        userId,
        tickets: dto.tickets,
      });

      const createdCount = result.results.filter((r) => r.ticketId).length;
      const errorCount = result.results.filter((r) => r.error).length;

      this.logger.log(
        `✅ Bulk creation complete: ${createdCount}/${dto.tickets.length} tickets created${
          errorCount > 0 ? `, ${errorCount} errors` : ''
        }`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(`Bulk creation failed: ${error.message}`);

      // Return proper error format (not wrapped in BadRequestException)
      // NestJS will handle the error response format
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new BadRequestException(
        error.message || 'Failed to create tickets from breakdown',
      );
    }
  }

  /**
   * Enrich multiple tickets in parallel
   *
   * Runs deep analysis + question generation for all tickets simultaneously.
   * Streams SSE progress events so frontend can show real-time agent progress.
   *
   * Request body: ticketIds, repositoryOwner, repositoryName, branch
   * Response: SSE stream with progress events, final event contains questions grouped by ticketId
   */
  @Post('bulk/enrich')
  async enrichMultipleTickets(
    @WorkspaceId() workspaceId: string,
    @Body() dto: BulkEnrichDto,
    @Res() res: Response,
  ) {
    this.logger.log(
      `⚙️ Starting parallel enrichment of ${dto.ticketIds.length} tickets`,
    );

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const result = await this.enrichMultipleTicketsUseCase.execute({
        workspaceId,
        ticketIds: dto.ticketIds,
        onProgress: (event) => {
          // Send progress event via SSE
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        },
      });

      // Send final completion event
      const completeEvent = {
        type: 'complete',
        questions: Object.fromEntries(result.questions),
        errors: Object.fromEntries(result.errors),
        completedCount: result.completedCount,
        failedCount: result.failedCount,
      };
      res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
      res.end();
    } catch (error: any) {
      this.logger.error(`Enrichment failed: ${error.message}`);
      const errorEvent = {
        type: 'error',
        message: error.message || 'Failed to enrich tickets',
      };
      res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
      res.end();
    }
  }

  /**
   * Finalize multiple enriched tickets in parallel
   *
   * Submits question answers for all tickets and generates specs simultaneously.
   * Streams SSE progress events so frontend can show real-time finalization progress.
   *
   * Request body: answers array with ticketId, questionId, answer
   * Response: SSE stream with progress events, final event contains results for each ticket
   */
  @Post('bulk/finalize')
  async finalizeMultipleTickets(
    @WorkspaceId() workspaceId: string,
    @Body() dto: BulkFinalizeDto,
    @Res() res: Response,
  ) {
    this.logger.log(
      `⚙️ Starting parallel finalization of ${new Set(dto.answers.map((a) => a.ticketId)).size} tickets`,
    );

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const result = await this.finalizeMultipleTicketsUseCase.execute({
        workspaceId,
        answers: dto.answers,
        onProgress: (event) => {
          // Send progress event via SSE
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        },
      });

      // Send final completion event
      const completeEvent = {
        type: 'complete',
        results: result.results,
        completedCount: result.completedCount,
        failedCount: result.failedCount,
      };
      res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
      res.end();
    } catch (error: any) {
      this.logger.error(`Finalization failed: ${error.message}`);
      const errorEvent = {
        type: 'error',
        message: error.message || 'Failed to finalize tickets',
      };
      res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
      res.end();
    }
  }

  /**
   * Save a PRD breakdown draft
   *
   * Persists the current breakdown state to Firestore for resuming later.
   * Called after analysis completes or on user edits.
   */
  @Post('breakdown/draft/save')
  @HttpCode(HttpStatus.OK)
  async saveBreakdownDraft(
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
    @Body() _dto: any, // SaveBreakdownDraftDto
  ) {
    if (!workspaceId || !userId) {
      throw new BadRequestException('Workspace and user IDs are required');
    }

    try {
      // Draft saving is handled by frontend storage
      // This endpoint is a placeholder for future Firestore persistence
      return {
        status: 'success',
        message: 'Draft saved (client-side storage)',
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to save draft: ${error.message}`);
    }
  }

  /**
   * Get the most recent breakdown draft
   *
   * Returns the latest saved draft for the user/workspace combination.
   * Used to show "Resume Draft?" banner on PRD input page.
   */
  @Get('breakdown/draft/latest')
  async getLatestBreakdownDraft(
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
  ) {
    if (!workspaceId || !userId) {
      throw new BadRequestException('Workspace and user IDs are required');
    }

    try {
      // Draft loading is handled by frontend storage
      // This endpoint is a placeholder for future Firestore persistence
      return {
        status: 'success',
        draft: null,
        message: 'No draft found (client-side storage)',
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to load draft: ${error.message}`);
    }
  }

  /**
   * Delete a breakdown draft
   *
   * Removes a draft from storage.
   * Called when user discards a draft or after creating tickets.
   */
  @Delete('breakdown/draft/:id')
  @HttpCode(HttpStatus.OK)
  async deleteBreakdownDraft(
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
    @Param('id') draftId: string,
  ) {
    if (!workspaceId || !userId || !draftId) {
      throw new BadRequestException('Workspace, user, and draft IDs are required');
    }

    try {
      // Draft deletion is handled by frontend storage
      // This endpoint is a placeholder for future Firestore persistence
      return {
        status: 'success',
        message: 'Draft deleted (client-side storage)',
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to delete draft: ${error.message}`);
    }
  }
}
