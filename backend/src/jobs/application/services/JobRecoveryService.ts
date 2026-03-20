import { Injectable, Inject, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { JobRepository, JOB_REPOSITORY } from '../ports/JobRepository.port';
import { BackgroundFinalizationService } from './BackgroundFinalizationService';

@Injectable()
export class JobRecoveryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobRecoveryService.name);

  constructor(
    @Inject(JOB_REPOSITORY) private readonly jobRepository: JobRepository,
    private readonly backgroundFinalizationService: BackgroundFinalizationService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
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
}
