import {
  Controller,
  Post,
  Param,
  Query,
  HttpCode,
  UseGuards,
  Res,
  Logger,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { StartSessionUseCase } from '../../application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from '../../application/use-cases/CancelSessionUseCase';
import { SessionOrchestrator } from '../../application/services/SessionOrchestrator';
import { buildSystemPrompt } from '../../application/services/SystemPromptBuilder';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { RateLimitGuard } from '../../../shared/presentation/guards/RateLimitGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';
import { UserId } from '../../../shared/presentation/decorators/UserId.decorator';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';
import { GitHubAppTokenService } from '../../../github/application/services/github-app-token.service';
import { GitHubIntegrationRepository, GITHUB_INTEGRATION_REPOSITORY } from '../../../github/domain/GitHubIntegrationRepository';

@Controller('sessions')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(
    private readonly startSessionUseCase: StartSessionUseCase,
    private readonly cancelSessionUseCase: CancelSessionUseCase,
    private readonly sessionOrchestrator: SessionOrchestrator,
    private readonly githubAppTokenService: GitHubAppTokenService,
    @Inject(GITHUB_INTEGRATION_REPOSITORY)
    private readonly githubIntegrationRepository: GitHubIntegrationRepository,
  ) {}

  @UseGuards(RateLimitGuard)
  @Post(':ticketId/start')
  async startSession(
    @Param('ticketId') ticketId: string,
    @Query('skills') skillsParam: string | undefined,
    @Query('followUp') followUpParam: string | undefined,
    @Query('repo') repoParam: string | undefined,
    @TeamId() teamId: string,
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const skillIds = skillsParam ? skillsParam.split(',').filter(Boolean) : [];
    // 1. Create session (validates ticket, quota, etc.)
    const { sessionId, repoOwner, repoName, branch, model, maxDurationMs, fileChanges } = await this.startSessionUseCase.execute({
      ticketId,
      userId,
      teamId,
    });

    // 2. Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: Record<string, unknown>) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    // 3. Send provisioning status
    send({ type: 'session.status', content: 'provisioning', toolUseId: sessionId });

    // 4. Handle client disconnect
    let clientDisconnected = false;
    res.on('close', () => {
      clientDisconnected = true;
      this.logger.log(`Session ${sessionId} SSE stream closed by client`);
    });

    // 5. Build sandbox config
    const { token: githubToken, installationId } = await this.getGitHubToken(teamId, workspaceId);
    const repoUrl =
      repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}.git` : '';

    // Generate session-scoped JWT so the sandbox MCP server can call the Forge API
    const jwtInviteSecret = process.env.JWT_INVITE_SECRET;
    if (!jwtInviteSecret) {
      throw new Error('JWT_INVITE_SECRET environment variable is required');
    }

    const sessionJwt = jwt.sign(
      { sessionId, teamId, ticketId, type: 'session' },
      jwtInviteSecret,
      { expiresIn: '2h', algorithm: 'HS256' },
    );

    const sandboxConfig = {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      githubToken,
      forgeApiUrl: process.env.FORGE_API_URL || 'https://forge-x3i7.onrender.com/api',
      forgeSessionJwt: sessionJwt,
      ticketId,
      repoUrl,
      branch,
      systemPrompt: buildSystemPrompt(ticketId, fileChanges, followUpParam),
      model,
      maxDurationMs,
      installationId: installationId ?? undefined,
      skillIds,
    };

    // Fail-fast: validate required sandbox config before spinning up the sandbox
    const missingConfig: string[] = [];
    if (!sandboxConfig.anthropicApiKey) missingConfig.push('ANTHROPIC_API_KEY');
    if (!sandboxConfig.repoUrl)
      missingConfig.push('Repository URL (no GitHub App installed or no repo connected)');

    if (missingConfig.length > 0) {
      const errorMsg = `Cannot start development: missing ${missingConfig.join(', ')}`;
      this.logger.error(errorMsg);
      send({ type: 'session.status', content: 'failed', error: errorMsg });
      res.end();
      return;
    }

    // 6. Run orchestrator (fire-and-forget style, streams via SSE)
    try {
      await this.sessionOrchestrator.run(sessionId, teamId, sandboxConfig, {
        onEvent: (event) => {
          if (!clientDisconnected) {
            send(event as unknown as Record<string, unknown>);
          }
        },
        onComplete: () => {
          if (!clientDisconnected) {
            send({ type: 'session.status', content: 'completed' });
            res.end();
          }
        },
        onError: (error) => {
          if (!clientDisconnected) {
            send({ type: 'session.status', content: 'failed', error });
            res.end();
          }
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Session ${sessionId} orchestration failed: ${errorMessage}`);
      if (!clientDisconnected && !res.writableEnded) {
        send({ type: 'session.status', content: 'failed', error: errorMessage });
        res.end();
      }
    }

    // If orchestrator completed but res not ended (edge case)
    if (!res.writableEnded) {
      res.end();
    }
  }

  private async getGitHubToken(
    teamId: string,
    workspaceId: string,
  ): Promise<{ token: string; installationId: number | null }> {
    try {
      // Look up the GitHub integration using the legacy workspaceId (not teamId).
      // WorkspaceGuard derives workspaceId as ws_team_<prefix> for backward-compat
      // with integrations stored before the teamId-based routing was introduced.
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(workspaceId);

      if (integration) {
        this.logger.log(
          `Found GitHub integration for workspace ${workspaceId} (team ${teamId}), installationId=${integration.installationId}`,
        );
        const token = await this.githubAppTokenService.getInstallationToken(integration.installationId);
        return { token, installationId: integration.installationId };
      }

      // Fallback: no Firestore record found. This can happen when the GitHub App was
      // installed on the org but the OAuth integration was never completed (or was
      // stored under a different workspaceId).  Query the GitHub App API directly to
      // get the first available installation ID.
      this.logger.warn(
        `No GitHub integration record found for workspace ${workspaceId} (team ${teamId}). Falling back to GitHub App installations API.`,
      );

      const installationId = await this.githubAppTokenService.getFirstInstallationId();
      if (!installationId) {
        this.logger.warn(`No GitHub App installations found — sandbox will run without a token`);
        return { token: '', installationId: null };
      }

      const token = await this.githubAppTokenService.getInstallationToken(installationId);
      return { token, installationId };
    } catch (error) {
      this.logger.warn(`Failed to get GitHub token for team ${teamId}: ${error}`);
      return { token: '', installationId: null };
    }
  }

  @Post(':sessionId/cancel')
  @HttpCode(204)
  async cancelSession(
    @Param('sessionId') sessionId: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<void> {
    await this.cancelSessionUseCase.execute({ sessionId, userId, teamId });
  }
}
