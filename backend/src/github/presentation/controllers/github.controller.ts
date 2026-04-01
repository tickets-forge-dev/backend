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
  Query,
  UseGuards,
  Logger,
  NotFoundException,
  ForbiddenException,
  Req,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { GitHubApiService } from '../../../shared/infrastructure/github/github-api.service';
import {
  GitHubIntegrationRepository,
  GITHUB_INTEGRATION_REPOSITORY,
} from '../../domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../application/services/github-token.service';
import { RepositoryResponseDto, BranchesResponseDto, BranchDto } from '../dto/repository.dto';

@ApiTags('github')
@Controller('github')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(
    private readonly gitHubApiService: GitHubApiService,
    @Inject(GITHUB_INTEGRATION_REPOSITORY)
    private readonly gitHubIntegrationRepository: GitHubIntegrationRepository,
    private readonly gitHubTokenService: GitHubTokenService,
  ) {}

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
    @Req() req: any,
  ): Promise<RepositoryResponseDto> {
    this.logger.log(`Getting repository: ${owner}/${repo}`);

    try {
      const accessToken = await this.getWorkspaceAccessToken(req.workspaceId);
      const repository = await this.gitHubApiService.getRepository(owner, repo, accessToken);

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
    @Req() req: any,
  ): Promise<BranchesResponseDto> {
    this.logger.log(`Getting branches for: ${owner}/${repo}`);

    try {
      const accessToken = await this.getWorkspaceAccessToken(req.workspaceId);
      // listBranches already resolves isDefault per branch — extract default from there
      // (avoids a redundant repos.get API call that was causing timeouts)
      const branches = await this.gitHubApiService.listBranches(owner, repo, accessToken);
      const defaultBranch = branches.find((b) => b.isDefault)?.name || 'main';

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

  /**
   * Get repository file contents for WebContainer preview.
   * Returns a flat map of { path: content } for all text files.
   * Skips node_modules, .git, binaries, and files > 100KB.
   */
  @Get('repos/:owner/:repo/contents')
  @ApiOperation({ summary: 'Get repository file contents for preview' })
  async getContents(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('branch') branch: string = 'main',
    @Req() req: any,
  ): Promise<{ files: Record<string, string>; truncated: boolean }> {
    this.logger.log(`Fetching contents for preview: ${owner}/${repo}@${branch}`);

    const accessToken = await this.getWorkspaceAccessToken(req.workspaceId);
    const octokit = new Octokit({ auth: accessToken });

    const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.turbo', '__pycache__']);
    const SKIP_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.zip', '.tar', '.gz', '.lock']);
    const MAX_FILE_SIZE = 100_000; // 100KB
    const MAX_FILES = 500;

    try {
      // 1. Get file tree
      const treeResponse = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: '1',
      });

      // 2. Filter to text files only
      const entries = treeResponse.data.tree.filter((entry) => {
        if (entry.type !== 'blob') return false;
        if (!entry.path) return false;
        if ((entry.size ?? 0) > MAX_FILE_SIZE) return false;

        // Skip directories
        const parts = entry.path.split('/');
        if (parts.some((p) => SKIP_DIRS.has(p))) return false;

        // Skip binary extensions
        const ext = '.' + entry.path.split('.').pop()?.toLowerCase();
        if (SKIP_EXTENSIONS.has(ext)) return false;

        return true;
      });

      const filesToFetch = entries.slice(0, MAX_FILES);

      // 3. Fetch file contents in parallel (batched)
      const files: Record<string, string> = {};
      const BATCH_SIZE = 20;

      for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
        const batch = filesToFetch.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (entry) => {
            const response = await octokit.repos.getContent({
              owner,
              repo,
              path: entry.path!,
              ref: branch,
            });
            const data = response.data as any;
            if (data.encoding === 'base64' && data.content) {
              return { path: entry.path!, content: Buffer.from(data.content, 'base64').toString('utf-8') };
            }
            return null;
          }),
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            files[result.value.path] = result.value.content;
          }
        }
      }

      return {
        files,
        truncated: entries.length > MAX_FILES || treeResponse.data.truncated || false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch contents for ${owner}/${repo}:`, error.message);
      if (error.status === 404) {
        throw new NotFoundException(`Repository or branch not found: ${owner}/${repo}@${branch}`);
      }
      if (error.status === 403) {
        throw new ForbiddenException(`Access denied to ${owner}/${repo}`);
      }
      throw error;
    }
  }

  /**
   * Helper: Get and decrypt GitHub access token for workspace
   */
  private async getWorkspaceAccessToken(workspaceId: string): Promise<string> {
    const integration = await this.gitHubIntegrationRepository.findByWorkspaceId(workspaceId);

    if (!integration) {
      throw new UnauthorizedException('GitHub integration not found. Please connect GitHub first.');
    }

    const accessToken = await this.gitHubTokenService.decryptToken(
      integration.encryptedAccessToken,
    );
    return accessToken;
  }
}
