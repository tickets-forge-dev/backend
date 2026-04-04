import { Injectable, Inject, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { JobRepository, JOB_REPOSITORY } from '../ports/JobRepository.port';
import { BackgroundFinalizationService } from './BackgroundFinalizationService';

/** Check for stuck jobs every 2 minutes */
const STUCK_CHECK_INTERVAL_MS = 2 * 60 * 1000;

/** A job is considered stuck if it hasn't been updated in 10 minutes */
const STUCK_THRESHOLD_MS = 10 * 60 * 1000;

@Injectable()
export class JobRecoveryService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(JobRecoveryService.name);
  private stuckCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(JOB_REPOSITORY) private readonly jobRepository: JobRepository,
    private readonly backgroundFinalizationService: BackgroundFinalizationService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Recover orphaned jobs from a previous server crash
    await this.recoverOrphanedJobs();

    // Start periodic check for stuck jobs during runtime
    this.stuckCheckTimer = setInterval(() => {
      void this.failStuckJobs().catch((err) => {
        this.logger.error(`Stuck job check failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, STUCK_CHECK_INTERVAL_MS);

    this.logger.log(`Stuck job detector started (interval: ${STUCK_CHECK_INTERVAL_MS / 1000}s, threshold: ${STUCK_THRESHOLD_MS / 1000}s)`);
  }

  onApplicationShutdown(): void {
    if (this.stuckCheckTimer) {
      clearInterval(this.stuckCheckTimer);
      this.stuckCheckTimer = null;
    }
  }

  /**
   * Recover orphaned jobs on startup — re-spawn finalization.
   */
  private async recoverOrphanedJobs(): Promise<void> {
    try {
      const orphanedJobs = await this.jobRepository.findOrphaned();

      if (orphanedJobs.length === 0) {
        this.logger.log('No orphaned jobs found during startup recovery');
        return;
      }

      this.logger.warn(
        `Found ${orphanedJobs.length} orphaned job(s) — re-spawning finalization`,
      );

      for (const job of orphanedJobs) {
        this.logger.log(
          `Recovering job ${job.id} for ticket ${job.ticketId} (status: ${job.status}, attempt: ${job.attempt})`,
        );

        // Spawn detached async finalization (fire-and-forget)
        void this.backgroundFinalizationService
          .run(job.id, job.ticketId, job.teamId)
          .catch((error: Error) => {
            this.logger.error(
              `Recovery finalization failed for job ${job.id}: ${error.message}`,
            );
          });
      }
    } catch (error) {
      this.logger.error(
        `Job recovery failed during startup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Find jobs that are still in 'running' or 'retrying' but haven't been
   * updated in over STUCK_THRESHOLD_MS. Mark them as failed so the user
   * sees an error instead of an infinite spinner.
   */
  private async failStuckJobs(): Promise<void> {
    const orphanedJobs = await this.jobRepository.findOrphaned();
    if (orphanedJobs.length === 0) return;

    const now = Date.now();
    let failedCount = 0;

    for (const job of orphanedJobs) {
      const staleness = now - job.updatedAt.getTime();
      if (staleness < STUCK_THRESHOLD_MS) continue; // Still within threshold

      this.logger.warn(
        `Job ${job.id} stuck for ${Math.round(staleness / 1000)}s (last phase: ${job.phase}, percent: ${job.percent}%) — marking as failed`,
      );

      job.markFailed(`Generation timed out — no progress for ${Math.round(staleness / 60000)} minutes. Please retry.`);
      await this.jobRepository.save(job);
      failedCount++;
    }

    if (failedCount > 0) {
      this.logger.warn(`Marked ${failedCount} stuck job(s) as failed`);
    }
  }
}
