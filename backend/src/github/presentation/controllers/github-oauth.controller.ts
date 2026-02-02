/**
 * GitHub OAuth Controller
 * 
 * Handles GitHub OAuth flow endpoints:
 * - GET /api/github/oauth/authorize - Generate OAuth URL
 * - GET /api/github/oauth/callback - Handle OAuth callback
 * - GET /api/github/repositories - List user repositories
 * - POST /api/github/repositories/select - Select repositories for indexing
 * - POST /api/github/disconnect - Disconnect GitHub integration
 * - GET /api/github/connection - Check connection status
 * 
 * Part of: Story 4.1 - GitHub App Integration
 * Layer: Presentation (HTTP/REST)
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Session,
  Redirect,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';
import { GitHubTokenService } from '../../application/services/github-token.service';
import { GitHubIntegrationRepository, GITHUB_INTEGRATION_REPOSITORY } from '../../domain/GitHubIntegrationRepository';
import { GitHubIntegration } from '../../domain/GitHubIntegration';
import { GitHubRepository } from '../../domain/GitHubRepository';

interface OAuthSession {
  state?: string;
  workspaceId?: string;
}

@ApiTags('github-oauth')
@Controller('github/oauth')
export class GitHubOAuthController {
  private readonly logger = new Logger(GitHubOAuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: GitHubTokenService,
    @Inject(GITHUB_INTEGRATION_REPOSITORY)
    private readonly integrationRepository: GitHubIntegrationRepository,
  ) {}

  /**
   * AC#2: Generate OAuth authorization URL
   * GET /api/github/oauth/authorize
   */
  @Get('authorize')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'Get GitHub OAuth authorization URL' })
  @ApiResponse({
    status: 200,
    description: 'OAuth URL generated successfully',
    schema: {
      properties: {
        oauthUrl: { type: 'string' },
        state: { type: 'string' },
      },
    },
  })
  async authorize(
    @WorkspaceId() workspaceId: string,
    @Session() session: OAuthSession,
  ): Promise<{ oauthUrl: string; state: string }> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GITHUB_OAUTH_REDIRECT_URI');

    this.logger.log(`GitHub OAuth config check - ClientID: ${clientId ? '✓ set' : '✗ missing'}, RedirectURI: ${redirectUri ? '✓ set' : '✗ missing'}`);

    if (!clientId || !redirectUri) {
      this.logger.error('GitHub OAuth not configured - missing env vars');
      throw new InternalServerErrorException('GitHub OAuth not configured');
    }

    // Generate and store state parameter for CSRF protection
    const state = this.tokenService.generateState();
    session.state = state;
    session.workspaceId = workspaceId;

    this.logger.log(`📝 Session created - State: ${state.substring(0, 8)}..., Workspace: ${workspaceId}, Session ID: ${(session as any).id || 'unknown'}`);

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user,repo&state=${state}`;

    this.logger.log(`Generated OAuth URL for workspace ${workspaceId}`);

    return { oauthUrl, state };
  }

  /**
   * AC#2, #3: Handle OAuth callback
   * GET /api/github/oauth/callback
   */
  @Get('callback')
  @ApiOperation({ summary: 'Handle GitHub OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  @Redirect()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Session() session: OAuthSession,
  ): Promise<{ url: string }> {
    try {
      this.logger.log(`🔍 Callback received - State from GitHub: ${state.substring(0, 8)}..., State in session: ${session.state?.substring(0, 8) || 'NONE'}, Session ID: ${(session as any).id || 'unknown'}`);

      // Validate state parameter (CSRF protection)
      if (!session.state || !this.tokenService.validateState(state, session.state)) {
        this.logger.error(`❌ OAuth state validation failed - Session state: ${session.state ? 'exists' : 'missing'}, GitHub state: ${state ? 'exists' : 'missing'}`);
        return { url: `${this.configService.get('FRONTEND_URL')}/settings?error=invalid_state` };
      }

      const workspaceId = session.workspaceId;
      if (!workspaceId) {
        this.logger.error('No workspace ID in session');
        return { url: `${this.configService.get('FRONTEND_URL')}/settings?error=no_workspace` };
      }

      // Exchange code for token
      const tokenResponse = await this.tokenService.exchangeCodeForToken(code);
      
      // Get user info
      const userInfo = await this.tokenService.getUserInfo(tokenResponse.accessToken);

      // Encrypt token
      const encryptedToken = await this.tokenService.encryptToken(tokenResponse.accessToken);

      // Check if integration already exists
      const existingIntegration = await this.integrationRepository.findByWorkspaceId(workspaceId);

      if (existingIntegration) {
        // Update existing integration
        existingIntegration.updateAccessToken(encryptedToken);
        await this.integrationRepository.save(existingIntegration);
      } else {
        // Create new integration
        const integration = GitHubIntegration.create(
          `gh_${workspaceId}`,
          workspaceId,
          userInfo.id,
          userInfo.login,
          userInfo.type,
          encryptedToken,
        );
        await this.integrationRepository.save(integration);
      }

      // Clear session state
      delete session.state;
      delete session.workspaceId;

      this.logger.log(`GitHub connected successfully for workspace ${workspaceId}`);
      
      return { url: `${this.configService.get('FRONTEND_URL')}/settings?connected=true` };
    } catch (error: any) {
      this.logger.error('OAuth callback failed:', error.message);
      return { url: `${this.configService.get('FRONTEND_URL')}/settings?error=connection_failed` };
    }
  }

  /**
   * AC#4: List user's accessible repositories
   * GET /api/github/repositories
   */
  @Get('repositories')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'List user repositories' })
  @ApiResponse({
    status: 200,
    description: 'Repository list retrieved successfully',
  })
  async listRepositories(@WorkspaceId() workspaceId: string) {
    try {
      const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);

      if (!integration) {
        throw new NotFoundException('GitHub not connected');
      }

      // Decrypt token
      const accessToken = await this.tokenService.decryptToken(integration.encryptedAccessToken);

      // Fetch repositories
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        sort: 'updated',
      });

      const repositories = data.map((repo) => ({
        id: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        private: repo.private,
        defaultBranch: repo.default_branch,
        url: repo.html_url,
        updatedAt: repo.updated_at,
      }));

      return {
        repositories,
        totalCount: repositories.length,
      };
    } catch (error: any) {
      this.logger.error('Failed to list repositories:', error.message);
      throw new InternalServerErrorException('Failed to fetch repositories');
    }
  }

  /**
   * AC#5: Select repositories for indexing
   * POST /api/github/repositories/select
   */
  @Post('repositories/select')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'Select repositories for indexing' })
  @ApiResponse({
    status: 200,
    description: 'Repositories selected successfully',
  })
  async selectRepositories(
    @WorkspaceId() workspaceId: string,
    @Body() body: { repositories: Array<{ id: number; fullName: string; name: string; owner: string; private: boolean; defaultBranch: string; url: string }> },
  ) {
    try {
      if (!this.integrationRepository) {
        this.logger.error('Integration repository is null - Firebase may not be configured');
        throw new InternalServerErrorException('GitHub integration repository not available');
      }

      const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);

      if (!integration) {
        throw new NotFoundException('GitHub not connected');
      }

      // Convert to domain objects
      const repositories = body.repositories.map((repo) =>
        GitHubRepository.create({
          id: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          url: repo.url,
        })
      );

      // Update selection
      integration.selectRepositories(repositories);
      await this.integrationRepository.save(integration);

      this.logger.log(`Selected ${repositories.length} repositories for workspace ${workspaceId}`);

      return {
        success: true,
        selectedCount: repositories.length,
      };
    } catch (error: any) {
      this.logger.error('Failed to select repositories:', error.message, error.stack);
      
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to select repositories: ${error.message}`);
    }
  }

  /**
   * AC#7: Disconnect GitHub integration
   * POST /api/github/disconnect
   */
  @Post('disconnect')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'Disconnect GitHub integration' })
  @ApiResponse({
    status: 200,
    description: 'GitHub disconnected successfully',
  })
  async disconnect(@WorkspaceId() workspaceId: string) {
    this.logger.log(`Attempting to disconnect GitHub for workspace ${workspaceId}`);
    
    try {
      if (!this.integrationRepository) {
        this.logger.error('Integration repository is null - Firebase may not be configured');
        throw new InternalServerErrorException('GitHub integration repository not available');
      }

      this.logger.log(`Looking for integration for workspace ${workspaceId}`);
      const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);

      if (!integration) {
        this.logger.warn(`No integration found for workspace ${workspaceId}`);
        throw new NotFoundException('GitHub not connected');
      }

      this.logger.log(`Found integration for workspace ${workspaceId}, deleting...`);
      
      // Use direct delete by workspace ID to avoid collection group query
      await this.integrationRepository.deleteByWorkspaceId(workspaceId);

      this.logger.log(`Successfully disconnected GitHub for workspace ${workspaceId}`);

      return {
        success: true,
        message: 'GitHub disconnected successfully',
      };
    } catch (error: any) {
      this.logger.error(`Failed to disconnect GitHub for workspace ${workspaceId}:`, error.message, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to disconnect GitHub: ${error.message}`);
    }
  }

  /**
   * AC#1: Check connection status
   * GET /api/github/connection
   */
  @Get('connection')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'Check GitHub connection status' })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved',
  })
  async getConnectionStatus(@WorkspaceId() workspaceId: string) {
    try {
      const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);

      if (!integration) {
        return {
          connected: false,
        };
      }

      return {
        connected: true,
        accountLogin: integration.accountLogin,
        accountType: integration.accountType,
        connectedAt: integration.connectedAt,
        selectedRepositoryCount: integration.selectedRepositoryCount,
        selectedRepositories: integration.selectedRepositories.map((repo) => ({
          id: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner,
          private: repo.isPrivate,
          defaultBranch: repo.defaultBranch,
          url: repo.url,
        })),
      };
    } catch (error: any) {
      this.logger.error('Failed to get connection status:', error.message);
      throw new InternalServerErrorException('Failed to get connection status');
    }
  }
}
