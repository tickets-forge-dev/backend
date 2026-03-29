import {
  Controller,
  Post,
  Param,
  HttpCode,
  UseGuards,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { StartSessionUseCase } from '../../application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from '../../application/use-cases/CancelSessionUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';
import { UserId } from '../../../shared/presentation/decorators/UserId.decorator';

@Controller('sessions')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(
    private readonly startSessionUseCase: StartSessionUseCase,
    private readonly cancelSessionUseCase: CancelSessionUseCase,
  ) {}

  @Post(':ticketId/start')
  async startSession(
    @Param('ticketId') ticketId: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    // 1. Create session (validates ticket, quota, etc.)
    const { sessionId } = await this.startSessionUseCase.execute({
      ticketId,
      userId,
      teamId,
    });

    // 2. Set SSE headers (exact pattern from tickets controller)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 3. Send session lifecycle events
    send({ type: 'session.status', content: 'provisioning', toolUseId: sessionId });
    send({ type: 'session.status', content: 'running' });

    // TODO: In future tasks, SessionOrchestrator will:
    // - Provision E2B sandbox
    // - Start Claude Code CLI
    // - Stream translated events via send()
    // - Call send({ type: 'event.summary', ... }) on completion
    // For now, send a placeholder completion after a brief delay

    // Placeholder: simulate a short session
    send({ type: 'event.message', content: 'Cloud Develop session started. E2B sandbox integration coming soon.' });
    send({ type: 'event.summary', costUsd: 0, durationMs: 0, numTurns: 0 });

    res.end();

    this.logger.log(`Session ${sessionId} SSE stream completed for ticket ${ticketId}`);
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
