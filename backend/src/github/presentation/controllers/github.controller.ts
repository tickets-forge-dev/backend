/**
 * GitHub Controller
 *
 * REST API endpoints for GitHub repository and branch information.
 * AC#6: GET /api/github/repos/:owner/:repo - returns repository info with default branch
 * AC#6: GET /api/github/repos/:owner/:repo/branches - returns branch list with metadata
 *
 * Presentation Layer - Handles HTTP concerns only
 */

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { GitHubApiService } from '../../../shared/infrastructure/github/github-api.service';
import {
  RepositoryResponseDto,
  BranchesResponseDto,
  BranchDto,
} from '../dto/repository.dto';

@ApiTags('github')
@Controller('github')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(private readonly gitHubApiService: GitHubApiService) {}

  /**
   * Get repository information including default branch
   * AC#6: GET /api/github/repos/:owner/:repo
   */
  @Get('repos/:owner/:repo')
  @ApiOperation({ summary: 'Get repository information' })
  @ApiParam({ name: 'owner', description: 'Repository owner (user or org)' })
  @ApiParam({ name: 'repo', description: 'Repository name' })
  @ApiResponse({
    status: 200,
    description: 'Repository information retrieved successfully',
    type: RepositoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  @ApiResponse({ status: 403, description: 'Access denied to repository' })
  async getRepository(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ): Promise<RepositoryResponseDto> {
    this.logger.log(`Getting repository: ${owner}/${repo}`);

    try {
      const repository = await this.gitHubApiService.getRepository(owner, repo);

      return {
        fullName: repository.fullName,
        defaultBranch: repository.defaultBranch,
        isPrivate: repository.isPrivate,
        description: repository.description,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get repository ${owner}/${repo}:`, error.message);

      if (error.message.includes('not found') || error.message.includes('not accessible')) {
        throw new NotFoundException(`Repository ${owner}/${repo} not found`);
      }

      if (error.message.includes('access') || error.message.includes('forbidden')) {
        throw new ForbiddenException(`Access denied to repository ${owner}/${repo}`);
      }

      throw error;
    }
  }

  /**
   * Get list of branches with metadata
   * AC#6: GET /api/github/repos/:owner/:repo/branches
   */
  @Get('repos/:owner/:repo/branches')
  @ApiOperation({ summary: 'Get repository branches with metadata' })
  @ApiParam({ name: 'owner', description: 'Repository owner (user or org)' })
  @ApiParam({ name: 'repo', description: 'Repository name' })
  @ApiResponse({
    status: 200,
    description: 'Branch list retrieved successfully',
    type: BranchesResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  @ApiResponse({ status: 403, description: 'Access denied to repository' })
  async getBranches(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ): Promise<BranchesResponseDto> {
    this.logger.log(`Getting branches for: ${owner}/${repo}`);

    try {
      const branches = await this.gitHubApiService.listBranches(owner, repo);
      const defaultBranch = await this.gitHubApiService.getDefaultBranch(owner, repo);

      const branchDtos: BranchDto[] = branches.map((branch) => ({
        name: branch.name,
        isDefault: branch.isDefault,
        commitSha: branch.commitSha,
        lastCommit: {
          sha: branch.lastCommit.sha,
          author: branch.lastCommit.author,
          date: branch.lastCommit.date.toISOString(),
          message: branch.lastCommit.message,
        },
      }));

      return {
        branches: branchDtos,
        defaultBranch,
        totalCount: branchDtos.length,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get branches for ${owner}/${repo}:`, error.message);

      if (error.message.includes('not found') || error.message.includes('not accessible')) {
        throw new NotFoundException(`Repository ${owner}/${repo} not found`);
      }

      if (error.message.includes('access') || error.message.includes('forbidden')) {
        throw new ForbiddenException(`Access denied to repository ${owner}/${repo}`);
      }

      throw error;
    }
  }
}
