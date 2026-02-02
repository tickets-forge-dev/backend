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
import { Inject } from '@nestjs/common';
import {
  StartIndexingDto,
  QueryIndexDto,
  IndexStatusResponseDto,
  ModuleResponseDto,
  IndexStatsResponseDto,
} from '../dto/indexing.dto';
// TODO: Import guards when implementing security (Task 12)
// import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
// import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
// import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId';

@ApiTags('indexing')
@Controller('indexing')
// @UseGuards(FirebaseAuthGuard, WorkspaceGuard) // TODO: Enable when guards are ready
@ApiBearerAuth()
export class IndexingController {
  constructor(
    private readonly repoIndexerService: RepoIndexerService,
    private readonly indexQueryService: IndexQueryService,
    @Inject(INDEX_REPOSITORY)
    private readonly indexRepository: IndexRepository,
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
    // @WorkspaceId() workspaceId: string, // TODO: Get from guard
  ): Promise<{ indexId: string; message: string }> {
    // TODO: Get access token from GitHub integration
    // For now, use placeholder
    const workspaceId = 'ws_placeholder';
    const accessToken = 'placeholder_token';

    try {
      // For MVP: Call service directly (no queue yet)
      // TODO: When Redis is set up, queue the job instead
      // const job = await this.indexingQueue.add('index-repository', {
      //   workspaceId,
      //   repositoryId: dto.repositoryId,
      //   repositoryName: dto.repositoryName,
      //   commitSha: dto.commitSha,
      //   accessToken,
      // });

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
      repositoryName: index.repositoryName,
      status: index.status,
      filesIndexed: index.filesIndexed,
      totalFiles: index.totalFiles,
      filesSkipped: index.filesSkipped,
      parseErrors: index.parseErrors,
      progress: index.getProgress(),
      createdAt: index.createdAt,
      completedAt: index.completedAt || undefined,
      indexDurationMs: index.indexDurationMs,
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
    // @WorkspaceId() workspaceId: string, // TODO: Get from guard
    @Query('repositoryId') repositoryId?: number,
  ): Promise<IndexStatusResponseDto[]> {
    const workspaceId = 'ws_placeholder'; // TODO: Get from guard

    const indexes = repositoryId
      ? await this.indexRepository.findByWorkspaceAndRepo(
          workspaceId,
          repositoryId,
        )
      : await this.indexRepository.findByWorkspace(workspaceId);

    return indexes.map((index) => ({
      indexId: index.id,
      repositoryName: index.repositoryName,
      status: index.status,
      filesIndexed: index.filesIndexed,
      totalFiles: index.totalFiles,
      filesSkipped: index.filesSkipped,
      parseErrors: index.parseErrors,
      progress: index.getProgress(),
      createdAt: index.createdAt,
      completedAt: index.completedAt || undefined,
      indexDurationMs: index.indexDurationMs,
      errorDetails: index.errorDetails || undefined,
    }));
  }
}
