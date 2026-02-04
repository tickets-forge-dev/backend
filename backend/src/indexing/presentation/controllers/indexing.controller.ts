/**
 * Indexing Controller
 * 
 * HTTP endpoints for repository indexing operations.
 * Handles indexing requests, status queries, and code search.
 * 
 * Part of: Story 4.2 - Task 7 (Controllers)
 * Layer: Presentation
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Inject,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RepoIndexerService } from '../../application/services/repo-indexer.service';
import { IndexQueryService } from '../../application/services/index-query.service';
import { IndexRepository, INDEX_REPOSITORY } from '../../domain/IndexRepository';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { GitHubIntegrationRepository, GITHUB_INTEGRATION_REPOSITORY } from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import {
  StartIndexingDto,
  QueryIndexDto,
  IndexStatusResponseDto,
  ModuleResponseDto,
  IndexStatsResponseDto,
} from '../dto/indexing.dto';

@ApiTags('indexing')
@Controller('indexing')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
@ApiBearerAuth()
export class IndexingController {
  constructor(
    private readonly repoIndexerService: RepoIndexerService,
    private readonly indexQueryService: IndexQueryService,
    @Inject(INDEX_REPOSITORY)
    private readonly indexRepository: IndexRepository,
    @Inject(GITHUB_INTEGRATION_REPOSITORY)
    private readonly githubIntegrationRepository: GitHubIntegrationRepository,
    private readonly githubTokenService: GitHubTokenService,
  ) {}

  /**
   * Start indexing a repository
   * POST /api/indexing/start
   */
  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start repository indexing',
    description: 'Initiates async indexing job for a repository',
  })
  @ApiResponse({
    status: 202,
    description: 'Indexing job started',
    schema: {
      properties: {
        indexId: { type: 'string', example: 'idx_abc123' },
        message: { type: 'string', example: 'Indexing started' },
      },
    },
  })
  async startIndexing(
    @Body() dto: StartIndexingDto,
    @Req() req: any,
  ): Promise<{ indexId: string; message: string }> {
    const workspaceId = req.workspaceId;

    try {
      // Get access token from GitHub integration
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(workspaceId);
      
      if (!integration) {
        throw new BadRequestException('GitHub not connected. Please connect GitHub first.');
      }

      const accessToken = await this.githubTokenService.decryptToken(integration.encryptedAccessToken);

      const indexId = await this.repoIndexerService.index(
        workspaceId,
        dto.repositoryId,
        dto.repositoryName,
        dto.commitSha,
        accessToken,
      );

      return {
        indexId,
        message: 'Indexing started successfully',
      };
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(
        `Failed to start indexing: ${err.message}`,
      );
    }
  }

  /**
   * Get indexing status
   * GET /api/indexing/status/:indexId
   */
  @Get('status/:indexId')
  @ApiOperation({
    summary: 'Get indexing status',
    description: 'Returns current status and progress of an indexing job',
  })
  @ApiResponse({
    status: 200,
    description: 'Index status retrieved',
    type: IndexStatusResponseDto,
  })
  async getStatus(
    @Param('indexId') indexId: string,
  ): Promise<IndexStatusResponseDto> {
    const index = await this.indexRepository.findById(indexId);

    if (!index) {
      throw new NotFoundException(`Index not found: ${indexId}`);
    }

    return {
      indexId: index.id,
      repositoryId: index.repositoryId,
      repositoryName: index.repositoryName,
      status: index.status,
      filesIndexed: index.filesIndexed,
      totalFiles: index.totalFiles,
      filesSkipped: index.filesSkipped,
      parseErrors: index.parseErrors,
      progress: index.getProgress(),
      repoSizeMB: index.repoSizeMB,
      createdAt: index.createdAt,
      completedAt: index.completedAt || undefined,
      indexDurationMs: index.indexDurationMs,
      summary: index.summary || undefined,
      errorDetails: index.errorDetails || undefined,
    };
  }

  /**
   * Query indexed code
   * POST /api/indexing/query/:indexId
   */
  @Post('query/:indexId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search indexed code',
    description: 'Find modules by intent/keywords for ticket generation',
  })
  @ApiResponse({
    status: 200,
    description: 'Relevant modules found',
    type: [ModuleResponseDto],
  })
  async queryIndex(
    @Param('indexId') indexId: string,
    @Body() dto: QueryIndexDto,
  ): Promise<ModuleResponseDto[]> {
    try {
      const modules = await this.indexQueryService.findModulesByIntent(
        dto.intent,
        indexId,
        dto.limit || 10,
      );

      return modules.map((module) => ({
        path: module.path,
        language: module.language,
        exports: module.exports,
        imports: module.imports,
        functions: module.functions,
        classes: module.classes,
        summary: module.summary,
        relevanceScore: module.relevanceScore,
      }));
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        throw new NotFoundException(err.message);
      }
      throw new BadRequestException(err.message);
    }
  }

  /**
   * Get index statistics
   * GET /api/indexing/stats/:indexId
   */
  @Get('stats/:indexId')
  @ApiOperation({
    summary: 'Get index statistics',
    description: 'Returns language breakdown and quality metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Index statistics retrieved',
    type: IndexStatsResponseDto,
  })
  async getStats(
    @Param('indexId') indexId: string,
  ): Promise<IndexStatsResponseDto> {
    try {
      return await this.indexQueryService.getIndexStats(indexId);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        throw new NotFoundException(err.message);
      }
      throw new BadRequestException(err.message);
    }
  }

  /**
   * List indexes for workspace
   * GET /api/indexing/list
   */
  @Get('list')
  @ApiOperation({
    summary: 'List all indexes for workspace',
    description: 'Returns all repository indexes for the current workspace',
  })
  @ApiResponse({
    status: 200,
    description: 'Indexes listed',
    type: [IndexStatusResponseDto],
  })
  async listIndexes(
    @Req() req: any,
    @Query('repositoryId') repositoryId?: number,
  ): Promise<IndexStatusResponseDto[]> {
    const workspaceId = req.workspaceId;

    console.log('═══════════════════════════════════════════════════════');
    console.log('[IndexingController.listIndexes] DEBUG INFO:');
    console.log(`  - WorkspaceId: ${workspaceId}`);
    console.log(`  - RepositoryId filter: ${repositoryId || 'none'}`);
    console.log(`  - User: ${req.user?.uid || 'NOT SET'}`);
    console.log('═══════════════════════════════════════════════════════');

    if (!workspaceId) {
      console.warn('[IndexingController.listIndexes] ⚠️  No workspaceId in request');
      return [];
    }

    try {
      console.log(`[IndexingController.listIndexes] 🔍 Fetching indexes for workspace: ${workspaceId}, repo: ${repositoryId || 'all'}`);
      
      const startTime = Date.now();
      const indexes = repositoryId
        ? await this.indexRepository.findByWorkspaceAndRepo(
            workspaceId,
            repositoryId,
          )
        : await this.indexRepository.findByWorkspace(workspaceId);

      const elapsed = Date.now() - startTime;
      console.log(`[IndexingController.listIndexes] ✅ Found ${indexes.length} indexes in ${elapsed}ms`);

      return indexes.map((index) => ({
        indexId: index.id,
        repositoryId: index.repositoryId,
        repositoryName: index.repositoryName,
        status: index.status,
        filesIndexed: index.filesIndexed,
        totalFiles: index.totalFiles,
        filesSkipped: index.filesSkipped,
        parseErrors: index.parseErrors,
        progress: index.getProgress(),
        repoSizeMB: index.repoSizeMB,
        createdAt: index.createdAt,
        completedAt: index.completedAt || undefined,
        indexDurationMs: index.indexDurationMs,
        summary: index.summary || undefined,
        errorDetails: index.errorDetails || undefined,
      }));
    } catch (error) {
      console.error('[IndexingController.listIndexes] ❌ Error:', error);
      console.error('[IndexingController.listIndexes] Error stack:', (error as Error).stack);
      // Return empty array instead of crashing - graceful degradation
      return [];
    }
  }
}
