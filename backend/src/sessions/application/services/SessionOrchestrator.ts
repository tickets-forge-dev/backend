import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionRepository, SESSION_REPOSITORY } from '../ports/SessionRepository.port';
import { SandboxPort, SandboxHandle, SandboxConfig, SANDBOX_PORT } from '../ports/SandboxPort';
import { translateEvent, RawCliEvent, UiEvent } from './EventTranslator';
import { NotificationService } from '../../../notifications/notification.service';
import { USAGE_QUOTA_REPOSITORY } from '../../../billing/application/ports';
import type { UsageQuotaRepository } from '../../../billing/application/ports/UsageQuotaRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import { AECStatus } from '../../../tickets/domain/value-objects/AECStatus';

export interface SessionProgressCallback {
  onEvent: (event: UiEvent) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

@Injectable()
export class SessionOrchestrator {
  private readonly logger = new Logger(SessionOrchestrator.name);
  private activeSandboxes = new Map<string, SandboxHandle>();

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
    @Inject(SANDBOX_PORT) private readonly sandboxPort: SandboxPort,
    private readonly notificationService: NotificationService,
    @Inject(USAGE_QUOTA_REPOSITORY) private readonly quotaRepository: UsageQuotaRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
  ) {}

  async run(
    sessionId: string,
    teamId: string,
    config: SandboxConfig,
    callback: SessionProgressCallback,
  ): Promise<void> {
    let sandbox: SandboxHandle | null = null;

    try {
      // 1. Provision sandbox
      this.logger.log(`Provisioning sandbox for session ${sessionId}`);
      sandbox = await this.sandboxPort.create(config);
      this.activeSandboxes.set(sessionId, sandbox);

      // 2. Update session to RUNNING
      const session = await this.sessionRepository.findById(sessionId, teamId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      if (!session.isActive()) {
        this.logger.log(`Session ${sessionId} is no longer active (${session.status}), aborting`);
        return;
      }
      session.markRunning(sandbox.id);
      await this.sessionRepository.save(session);

      // Notify frontend that sandbox is ready and Claude is starting
      callback.onEvent({ type: 'session.status', content: 'running' } as any);

      // 3. Stream stdout events
      let lastCostUsd = 0;

      await new Promise<void>((resolve, reject) => {
        let buffer = '';

        sandbox!.onStdout((line: string) => {
          buffer += line;
          const parts = buffer.split('\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            let raw: RawCliEvent;
            try {
              raw = JSON.parse(trimmed);
            } catch {
              continue;
            }

            const uiEvents = translateEvent(raw);
            for (const uiEvent of uiEvents) {
              if (uiEvent.type === 'event.summary') {
                lastCostUsd = uiEvent.costUsd ?? 0;
              }
              callback.onEvent(uiEvent);
            }
          }
        });

        sandbox!.onStderr((line: string) => {
          this.logger.warn(`Session ${sessionId} stderr: ${line}`);
        });

        sandbox!.onExit((code: number) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Claude Code exited with code ${code}`));
          }
        });
      });

      // 4. Mark session as completed
      const completedSession = await this.sessionRepository.findById(sessionId, teamId);
      if (completedSession && completedSession.isActive()) {
        completedSession.markCompleted(lastCostUsd, '', 0);
        await this.sessionRepository.save(completedSession);
      }

      // 5. Deduct quota (fire-and-forget — don't fail the session if quota update fails)
      if (completedSession) {
        try {
          const period = new Date().toISOString().slice(0, 7);
          const quota = await this.quotaRepository.getOrCreate(completedSession.teamId, period);
          quota.deduct();
          await this.quotaRepository.save(quota);
          this.logger.log(`Quota deducted for team ${completedSession.teamId}, period ${period}`);
        } catch (quotaError) {
          this.logger.warn(`Failed to deduct quota for session ${sessionId}: ${quotaError}`);
          // Don't fail the session — quota is a billing concern, not a session lifecycle concern
        }
      }

      callback.onComplete();
      this.logger.log(`Session ${sessionId} completed successfully`);

      // Fire-and-forget: notify ticket creator that PR is ready for review
      if (completedSession) {
        void this.notificationService
          .notifyTicketReadyForReview(
            completedSession.ticketId,
            completedSession.userId,
            completedSession.ticketTitle,
          )
          .catch(() => {});
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Session ${sessionId} failed: ${errorMessage}`);

      // Check if cancelled (race condition guard)
      const failedSession = await this.sessionRepository.findById(sessionId, teamId);
      if (failedSession && failedSession.status === 'cancelled') {
        this.logger.log(`Session ${sessionId} was cancelled, skipping error handling`);
        return;
      }

      if (failedSession && failedSession.isActive()) {
        failedSession.markFailed(errorMessage);
        await this.sessionRepository.save(failedSession);

        // Revert ticket from EXECUTING → APPROVED so the user can retry
        try {
          const aec = await this.aecRepository.findById(failedSession.ticketId);
          if (aec && aec.status === AECStatus.EXECUTING) {
            aec.sendBack(AECStatus.APPROVED);
            await this.aecRepository.save(aec);
            this.logger.log(`Reverted ticket ${failedSession.ticketId} from EXECUTING to APPROVED after session failure`);
          }
        } catch (rollbackError) {
          this.logger.warn(`Failed to rollback ticket for session ${sessionId}: ${rollbackError}`);
        }
      }

      callback.onError(errorMessage);
    } finally {
      // 5. Always cleanup sandbox
      if (sandbox) {
        try {
          await sandbox.destroy();
        } catch (destroyError) {
          this.logger.warn(`Failed to destroy sandbox for session ${sessionId}: ${destroyError}`);
        }
      }
      this.activeSandboxes.delete(sessionId);
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    const sandbox = this.activeSandboxes.get(sessionId);
    if (sandbox) {
      try {
        await sandbox.destroy();
      } catch (error) {
        this.logger.warn(`Failed to destroy sandbox during cancel for ${sessionId}: ${error}`);
      }
      this.activeSandboxes.delete(sessionId);
    }
  }
}
