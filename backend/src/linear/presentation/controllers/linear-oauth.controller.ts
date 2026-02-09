import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Logger,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Redirect,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';
import { LinearTokenService } from '../../application/services/linear-token.service';
import { LinearApiClient } from '../../application/services/linear-api-client';
import {
  LinearIntegrationRepository,
  LINEAR_INTEGRATION_REPOSITORY,
} from '../../domain/LinearIntegrationRepository';
import { LinearIntegration } from '../../domain/LinearIntegration';

@Controller('linear/oauth')
export class LinearOAuthController {
  private readonly logger = new Logger(LinearOAuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: LinearTokenService,
    private readonly apiClient: LinearApiClient,
    @Inject(LINEAR_INTEGRATION_REPOSITORY)
    private readonly integrationRepository: LinearIntegrationRepository,
  ) {}

  @Get('authorize')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async authorize(@WorkspaceId() workspaceId: string): Promise<{ oauthUrl: string; state: string }> {
    const clientId = this.configService.get<string>('LINEAR_CLIENT_ID');
    const redirectUri = this.configService.get<string>('LINEAR_OAUTH_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new InternalServerErrorException('Linear OAuth not configured');
    }

    const state = this.tokenService.generateSignedState(workspaceId);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read,write,issues:create',
      state,
      prompt: 'consent',
    });

    const oauthUrl = `https://linear.app/oauth/authorize?${params.toString()}`;

    return { oauthUrl, state };
  }

  @Get('callback')
  @Redirect()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<{ url: string }> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    try {
      const parsed = this.tokenService.parseSignedState(state);
      if (!parsed) {
        return { url: `${frontendUrl}/settings?error=invalid_state` };
      }

      const { workspaceId } = parsed;
      const redirectUri = this.configService.get<string>('LINEAR_OAUTH_REDIRECT_URI')!;

      const tokenResponse = await this.tokenService.exchangeCodeForToken(code, redirectUri);
      const userInfo = await this.apiClient.getViewer(tokenResponse.accessToken);
      const encryptedToken = await this.tokenService.encryptToken(tokenResponse.accessToken);

      const existing = await this.integrationRepository.findByWorkspaceId(workspaceId);
      if (existing) {
        existing.updateAccessToken(encryptedToken);
        await this.integrationRepository.save(existing);
      } else {
        const integration = LinearIntegration.create(
          `linear_${workspaceId}`,
          workspaceId,
          encryptedToken,
          userInfo.name,
        );
        await this.integrationRepository.save(integration);
      }

      this.logger.log(`Linear connected for workspace ${workspaceId}`);
      return { url: `${frontendUrl}/settings?linear_connected=true` };
    } catch (error: any) {
      this.logger.error(`Linear OAuth callback failed: ${error.message}`);
      return { url: `${frontendUrl}/settings?error=linear_connection_failed` };
    }
  }

  @Get('connection')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async getConnectionStatus(@WorkspaceId() workspaceId: string) {
    const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);
    if (!integration) {
      return { connected: false };
    }

    return {
      connected: true,
      userName: integration.userName,
      teamId: integration.teamId,
      teamName: integration.teamName,
      connectedAt: integration.connectedAt,
    };
  }

  @Get('teams')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async getTeams(@WorkspaceId() workspaceId: string) {
    const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);
    if (!integration) {
      throw new NotFoundException('Linear not connected');
    }

    const accessToken = await this.tokenService.decryptToken(integration.accessToken);
    const teams = await this.apiClient.getTeams(accessToken);
    return { teams };
  }

  @Post('disconnect')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async disconnect(@WorkspaceId() workspaceId: string) {
    const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);
    if (!integration) {
      throw new NotFoundException('Linear not connected');
    }

    await this.integrationRepository.deleteByWorkspaceId(workspaceId);
    return { success: true };
  }
}
