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
    const MAX_FILES = 200; // Keep under rate limits

    try {
      // 1. Resolve branch to commit SHA
      const branchInfo = await octokit.repos.getBranch({ owner, repo, branch });
      const commitSha = branchInfo.data.commit.sha;

      // 2. Get full file tree
      const treeResponse = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: commitSha,
        recursive: '1',
      });

      const allEntries = treeResponse.data.tree;

      // 3. Fetch ALL package.json files first (tiny, few API calls) to detect web app root
      const pkgEntries = allEntries.filter(
        (e) => e.type === 'blob' && e.path?.endsWith('package.json') && !e.path.includes('node_modules'),
      );

      const pkgFiles: Record<string, string> = {};
      const pkgResults = await Promise.allSettled(
        pkgEntries.map(async (entry) => {
          if (!entry.sha) return null;
          const response = await octokit.git.getBlob({ owner, repo, file_sha: entry.sha });
          if (response.data.encoding === 'base64' && response.data.content) {
            return { path: entry.path!, content: Buffer.from(response.data.content, 'base64').toString('utf-8') };
          }
          return null;
        }),
      );
      for (const result of pkgResults) {
        if (result.status === 'fulfilled' && result.value) {
          pkgFiles[result.value.path] = result.value.content;
        }
      }

      // 4. Detect web app root from package.json files
      // Score each package.json: web framework deps = high, workspace root = skip
      const WEB_DEPS = new Set(['react', 'react-dom', 'next', 'vue', 'nuxt', '@angular/core', 'svelte', '@sveltejs/kit', 'astro', 'remix', 'vite', 'solid-js', 'preact']);
      let bestRoot = '';
      let bestScore = -1;

      for (const [pkgPath, content] of Object.entries(pkgFiles)) {
        try {
          const pkg = JSON.parse(content);
          if (pkg.workspaces) continue; // Skip workspace roots
          if (!pkg.scripts?.dev && !pkg.scripts?.start) continue; // Must be runnable
          const dir = pkgPath === 'package.json' ? '' : pkgPath.replace('/package.json', '');
          const depth = dir ? dir.split('/').length : 0;
          let score = 0;
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          for (const dep of Object.keys(allDeps || {})) {
            if (WEB_DEPS.has(dep)) score += 10;
          }
          if (pkg.scripts?.dev) score += 5;
          score -= depth * 2;
          if (dir === '') score += 3;
          if (score > bestScore) { bestScore = score; bestRoot = dir; }
        } catch {}
      }

      this.logger.log(`Preview: detected web app root="${bestRoot || '(repo root)'}" score=${bestScore}`);

      // 5. Filter tree to only the winning directory's files
      const prefix = bestRoot ? bestRoot + '/' : '';
      const entries = allEntries.filter((entry) => {
        if (entry.type !== 'blob') return false;
        if (!entry.path) return false;
        if (prefix && !entry.path.startsWith(prefix)) return false;
        if ((entry.size ?? 0) > MAX_FILE_SIZE) return false;
        const parts = entry.path.split('/');
        if (parts.some((p) => SKIP_DIRS.has(p))) return false;
        const ext = '.' + entry.path.split('.').pop()?.toLowerCase();
        if (SKIP_EXTENSIONS.has(ext)) return false;
        return true;
      });

      const filesToFetch = entries.slice(0, MAX_FILES);

      // 6. Fetch only those files
      const files: Record<string, string> = {};
      const BATCH_SIZE = 15;

      for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
        const batch = filesToFetch.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (entry) => {
            if (!entry.sha) return null;
            const response = await octokit.git.getBlob({ owner, repo, file_sha: entry.sha });
            if (response.data.encoding === 'base64' && response.data.content) {
              // Strip the prefix so files are relative to the web app root
              const relativePath = prefix ? entry.path!.slice(prefix.length) : entry.path!;
              return { path: relativePath, content: Buffer.from(response.data.content, 'base64').toString('utf-8') };
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

      // Include package.json files that were already fetched (in case they're in the web app root)
      for (const [pkgPath, content] of Object.entries(pkgFiles)) {
        const relativePath = prefix ? (pkgPath.startsWith(prefix) ? pkgPath.slice(prefix.length) : null) : pkgPath;
        if (relativePath && !files[relativePath]) {
          files[relativePath] = content;
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
        const isRateLimit = error.message?.includes('rate limit');
        throw new ForbiddenException(isRateLimit
          ? 'GitHub API rate limit exceeded. Please wait a few minutes and try again.'
          : `Access denied to ${owner}/${repo}`);
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
