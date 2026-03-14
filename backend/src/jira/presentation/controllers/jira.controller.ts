import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
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

/** Block SSRF: reject private/reserved IP ranges and non-HTTPS URLs */
function validateJiraUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new BadRequestException('Invalid Jira URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new BadRequestException('Jira URL must use HTTPS');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block private/reserved hostnames
  const blocked = [
    'localhost', '127.0.0.1', '0.0.0.0', '[::1]',
    'metadata.google.internal',
  ];
  if (blocked.includes(hostname)) {
    throw new BadRequestException('Invalid Jira hostname');
  }

  // Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
  const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 127 ||
      a === 0
    ) {
      throw new BadRequestException('Invalid Jira hostname');
    }
  }

  return parsed.origin;
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

    // Validate and normalize URL (blocks SSRF against private IPs)
    const normalizedUrl = validateJiraUrl(jiraUrl);

    // Verify connection by calling Jira API
    let userInfo: { displayName: string; emailAddress: string };
    try {
      userInfo = await this.apiClient.verifyConnection(normalizedUrl, username, apiToken);
    } catch (error: any) {
      this.logger.warn(`Jira connection failed for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to connect to Jira. Check your URL and credentials.');
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

  @Get('issues/search')
  async searchIssues(
    @Query('query') query: string,
    @Req() req: any,
  ) {
    const workspaceId = req.workspaceId;
    const userId = req.user?.uid;

    if (!workspaceId || !userId) {
      throw new BadRequestException('Missing workspace or user');
    }

    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    const integration = await this.jiraRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!integration) {
      throw new BadRequestException('Jira not connected. Connect Jira in Settings.');
    }

    try {
      const apiToken = await this.tokenService.decryptToken(integration.apiToken);
      const issues = await this.apiClient.searchIssues(
        integration.jiraUrl,
        integration.username,
        apiToken,
        query,
      );

      return { issues };
    } catch (error: any) {
      this.logger.error(`Jira search failed for user ${userId}: ${error.message}`);
      throw new BadRequestException('Jira search failed. Please try again.');
    }
  }
}
