import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  BadRequestException,
  Logger,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { JiraTokenService } from '../../application/services/jira-token.service';
import { JiraApiClient } from '../../application/services/jira-api-client';
import {
  JiraIntegrationRepository,
  JIRA_INTEGRATION_REPOSITORY,
} from '../../domain/JiraIntegrationRepository';
import { JiraIntegration } from '../../domain/JiraIntegration';
import { randomUUID } from 'crypto';

interface ConnectBody {
  jiraUrl: string;
  username: string;
  apiToken: string;
}

@Controller('jira')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class JiraController {
  private readonly logger = new Logger(JiraController.name);

  constructor(
    private readonly tokenService: JiraTokenService,
    private readonly apiClient: JiraApiClient,
    @Inject(JIRA_INTEGRATION_REPOSITORY)
    private readonly jiraRepo: JiraIntegrationRepository,
  ) {}

  @Post('connect')
  async connect(
    @Body() body: ConnectBody,
    @Req() req: any,
  ) {
    const workspaceId = req.workspaceId;
    const userId = req.user?.uid;
    if (!workspaceId || !userId) throw new BadRequestException('Missing workspace or user');

    const { jiraUrl, username, apiToken } = body;
    if (!jiraUrl || !username || !apiToken) {
      throw new BadRequestException('jiraUrl, username, and apiToken are required');
    }

    // Normalize URL
    const normalizedUrl = jiraUrl.replace(/\/+$/, '');

    // Verify connection by calling Jira API
    let userInfo: { displayName: string; emailAddress: string };
    try {
      userInfo = await this.apiClient.verifyConnection(normalizedUrl, username, apiToken);
    } catch (error: any) {
      throw new BadRequestException(`Connection failed: ${error.message}`);
    }

    // Encrypt the API token before storing
    const encryptedToken = await this.tokenService.encryptToken(apiToken);

    // Check for existing integration
    const existing = await this.jiraRepo.findByUserAndWorkspace(userId, workspaceId);
    if (existing) {
      existing.updateCredentials(normalizedUrl, username, encryptedToken);
      await this.jiraRepo.save(existing);
    } else {
      const integration = JiraIntegration.create(
        randomUUID(),
        workspaceId,
        userId,
        normalizedUrl,
        username,
        encryptedToken,
      );
      await this.jiraRepo.save(integration);
    }

    this.logger.log(`Jira connected for user ${userId} (${userInfo.displayName})`);

    return {
      connected: true,
      displayName: userInfo.displayName,
      jiraUrl: normalizedUrl,
      username,
    };
  }

  @Get('connection')
  async getConnection(@Req() req: any) {
    const workspaceId = req.workspaceId;
    const userId = req.user?.uid;
    if (!workspaceId || !userId) throw new BadRequestException('Missing workspace or user');

    const integration = await this.jiraRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!integration) {
      return { connected: false };
    }

    return {
      connected: true,
      jiraUrl: integration.jiraUrl,
      username: integration.username,
      connectedAt: integration.connectedAt.toISOString(),
    };
  }

  @Get('projects')
  async getProjects(@Req() req: any) {
    const workspaceId = req.workspaceId;
    const userId = req.user?.uid;
    if (!workspaceId || !userId) throw new BadRequestException('Missing workspace or user');

    const integration = await this.jiraRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!integration) {
      throw new BadRequestException('Jira not connected. Connect Jira in Settings.');
    }

    const apiToken = await this.tokenService.decryptToken(integration.apiToken);
    const projects = await this.apiClient.getProjects(integration.jiraUrl, integration.username, apiToken);

    return { projects };
  }

  @Delete('disconnect')
  async disconnect(@Req() req: any) {
    const workspaceId = req.workspaceId;
    const userId = req.user?.uid;
    if (!workspaceId || !userId) throw new BadRequestException('Missing workspace or user');

    await this.jiraRepo.deleteByUserAndWorkspace(userId, workspaceId);

    this.logger.log(`Jira disconnected for user ${userId}`);
    return { success: true };
  }
}
