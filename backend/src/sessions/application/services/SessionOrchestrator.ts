import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionRepository, SESSION_REPOSITORY } from '../ports/SessionRepository.port';
import { SandboxPort, SandboxHandle, SandboxConfig, SANDBOX_PORT } from '../ports/SandboxPort';
import { translateEvent, RawCliEvent, UiEvent } from './EventTranslator';
import { NotificationService } from '../../../notifications/notification.service';
import { USAGE_QUOTA_REPOSITORY } from '../../../billing/application/ports';
import type { UsageQuotaRepository } from '../../../billing/application/ports/UsageQuotaRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import { AECStatus } from '../../../tickets/domain/value-objects/AECStatus';
import { GitHubAppTokenService } from '../../../github/application/services/github-app-token.service';

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
    private readonly githubAppTokenService: GitHubAppTokenService,
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
        const stderrLines: string[] = [];

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
          const trimmed = line.trim();
          if (trimmed) {
            this.logger.warn(`Session ${sessionId} stderr: ${trimmed}`);
            stderrLines.push(trimmed);
            // Send stderr to frontend as a diagnostic event
            callback.onEvent({
              type: 'event.stderr',
              content: trimmed,
            } as any);
          }
        });

        sandbox!.onExit((code: number) => {
          if (code === 0) {
            resolve();
          } else {
            const lastStderr = stderrLines.slice(-5).join('\n');
            const detail = lastStderr
              ? `Claude Code exited with code ${code}:\n${lastStderr}`
              : `Claude Code exited with code ${code}`;
            reject(new Error(detail));
          }
        });
      });

      // 4. Create PR on GitHub before marking session completed
      let prUrl = '';
      let prNumber = 0;

      this.logger.log(`Session ${sessionId} PR creation check: installationId=${config.installationId}, repoUrl=${config.repoUrl ? 'set' : 'EMPTY'}, branch=${config.branch || 'EMPTY'}`);

      if (config.installationId && config.repoUrl && config.branch) {
        // Brief delay to ensure the git push has propagated on GitHub's side
        await new Promise(r => setTimeout(r, 3000));

        try {
          // Parse owner/repo from repoUrl (e.g. https://github.com/owner/repo.git)
          const repoMatch = config.repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
          if (repoMatch) {
            const [, repoOwner, repoName] = repoMatch;

            // Load ticket for PR details
            const aec = await this.aecRepository.findById(config.ticketId);
            const ticketTitle = aec?.title || 'implement ticket';
            const changeRecord = aec?.changeRecord;
            const baseBranch = aec?.repositoryContext?.branchName || 'main';

            // Build detailed PR body
            const prBodyParts = [
              `## Summary`,
              changeRecord?.executionSummary || `Implemented via Forge Cloud Develop.`,
              ``,
            ];

            if (changeRecord?.decisions?.length) {
              prBodyParts.push(`## Decisions`);
              changeRecord.decisions.forEach((d: any) => prBodyParts.push(`- **${d.title}**: ${d.description}`));
              prBodyParts.push(``);
            }

            if (changeRecord?.risks?.length) {
              prBodyParts.push(`## Risks`);
              changeRecord.risks.forEach((r: any) => prBodyParts.push(`- **${r.title}**: ${r.description}`));
              prBodyParts.push(``);
            }

            if (changeRecord?.filesChanged?.length) {
              prBodyParts.push(`## Files Changed`);
              changeRecord.filesChanged.slice(0, 20).forEach((f: any) =>
                prBodyParts.push(`- \`${f.path}\` (+${f.additions} -${f.deletions})`)
              );
              if (changeRecord.filesChanged.length > 20) {
                prBodyParts.push(`- ... and ${changeRecord.filesChanged.length - 20} more`);
              }
              prBodyParts.push(``);
            }

            if (changeRecord?.divergences?.length) {
              prBodyParts.push(`## Spec Divergences`);
              changeRecord.divergences.forEach((d: any) =>
                prBodyParts.push(`- **${d.area}**: ${d.intended} → ${d.actual} (${d.justification})`)
              );
              prBodyParts.push(``);
            }

            prBodyParts.push(`---`, `Generated by [Forge Cloud Develop](https://forgetickets.com)`);

            const prParams = {
              installationId: config.installationId,
              owner: repoOwner,
              repo: repoName,
              head: config.branch,
              base: baseBranch,
              title: ticketTitle,
              body: prBodyParts.join('\n'),
            };

            // Attempt PR creation with one retry (branch may not be visible yet)
            let pr = await this.githubAppTokenService.createPullRequest(prParams);
            if (!pr) {
              this.logger.log(`Session ${sessionId}: first PR attempt failed, retrying in 5s...`);
              await new Promise(r => setTimeout(r, 5000));
              pr = await this.githubAppTokenService.createPullRequest(prParams);
            }

            if (pr) {
              prUrl = pr.prUrl;
              prNumber = pr.prNumber;
            } else {
              this.logger.error(`PR creation returned null for session ${sessionId} after retry`);
              callback.onEvent({ type: 'event.warning', message: 'PR creation failed — check GitHub App permissions and repository settings' } as any);
            }
          }
        } catch (prError) {
          this.logger.error(`Failed to create PR for session ${sessionId}: ${prError}`);
          callback.onEvent({ type: 'event.warning', message: `PR creation failed: ${prError instanceof Error ? prError.message : String(prError)}` } as any);
        }
      } else {
        this.logger.warn(`Session ${sessionId} skipped PR creation: installationId=${config.installationId || 'MISSING'}, repoUrl=${config.repoUrl || 'MISSING'}, branch=${config.branch || 'MISSING'}`);
      }

      // 4b. Ensure ticket is delivered with a change record
      try {
        const aecForDelivery = await this.aecRepository.findById(config.ticketId);
        if (!aecForDelivery) {
          this.logger.warn(`Session ${sessionId}: ticket ${config.ticketId} not found for auto-deliver`);
        } else if (aecForDelivery.status === AECStatus.EXECUTING) {
          this.logger.log(`Session ${sessionId}: auto-delivering ticket (agent didn't call submit_settlement)`);
          aecForDelivery.deliver({
            executionSummary: 'Development session completed. Changes committed and pushed.',
            filesChanged: [],
            divergences: [],
          });
          await this.aecRepository.save(aecForDelivery);
          this.logger.log(`Session ${sessionId}: ticket delivered successfully`);
        } else {
          this.logger.log(`Session ${sessionId}: ticket already ${aecForDelivery.status}, skipping auto-deliver`);
        }
      } catch (deliverError) {
        this.logger.error(`Session ${sessionId}: auto-deliver failed: ${deliverError}`);
      }

      // Mark session as completed (with PR info if available)
      const completedSession = await this.sessionRepository.findById(sessionId, teamId);
      if (completedSession && completedSession.isActive()) {
        completedSession.markCompleted(lastCostUsd, prUrl, prNumber);
        await this.sessionRepository.save(completedSession);
      }

      // Send summary event with PR details to frontend
      const repoMatch = config.repoUrl?.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
      const repoFullName = repoMatch ? `${repoMatch[1]}/${repoMatch[2]}` : null;
      callback.onEvent({
        type: 'event.summary',
        costUsd: lastCostUsd,
        durationMs: completedSession ? Date.now() - completedSession.createdAt.getTime() : 0,
        prUrl: prUrl || undefined,
        prNumber: prNumber || undefined,
        branch: config.branch || undefined,
        repoFullName,
      } as any);

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
