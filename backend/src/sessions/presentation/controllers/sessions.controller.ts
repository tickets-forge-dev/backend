import {
  Controller,
  Post,
  Param,
  HttpCode,
  UseGuards,
  Res,
  Logger,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { StartSessionUseCase } from '../../application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from '../../application/use-cases/CancelSessionUseCase';
import { SessionOrchestrator } from '../../application/services/SessionOrchestrator';
import { buildSystemPrompt } from '../../application/services/SystemPromptBuilder';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';
import { UserId } from '../../../shared/presentation/decorators/UserId.decorator';
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

  @Post(':ticketId/start')
  async startSession(
    @Param('ticketId') ticketId: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    // 1. Create session (validates ticket, quota, etc.)
    const { sessionId, repoOwner, repoName, branch } = await this.startSessionUseCase.execute({
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
    const githubToken = await this.getGitHubToken(teamId);
    const repoUrl =
      repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}.git` : '';

    const sandboxConfig = {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      githubToken,
      forgeApiUrl: process.env.FORGE_API_URL || 'https://forge-api.onrender.com/api',
      forgeSessionJwt: '', // TODO: Generate session-scoped JWT
      ticketId,
      repoUrl,
      branch,
      systemPrompt: buildSystemPrompt(ticketId),
      maxDurationMs: 30 * 60 * 1000, // 30 minutes
    };

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

  private async getGitHubToken(teamId: string): Promise<string> {
    try {
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(teamId);
      if (!integration) {
        this.logger.warn(`No GitHub App installation found for team ${teamId}`);
        return '';
      }
      return await this.githubAppTokenService.getInstallationToken(integration.installationId);
    } catch (error) {
      this.logger.warn(`Failed to get GitHub token for team ${teamId}: ${error}`);
      return '';
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
