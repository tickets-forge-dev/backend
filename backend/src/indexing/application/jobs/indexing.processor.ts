/**
 * Indexing Job Processor
 * 
 * Bull queue processor for async repository indexing.
 * Handles job execution, progress tracking, and retry logic.
 * 
 * Part of: Story 4.2 - Task 5 (Job Queue)
 * Layer: Application
 * 
 * Dependencies (install when needed):
 *   pnpm add @nestjs/bull bull
 * 
 * Note: Redis required for Bull queue
 *   - Development: Can test without queue (direct service calls)
 *   - Production: Use Upstash Redis (see REDIS_DEPLOYMENT_PLAN.md)
 */

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RepoIndexerService } from '../services/repo-indexer.service';

export interface IndexRepositoryJobData {
  workspaceId: string;
  repositoryId: number;
  repositoryName: string;
  commitSha: string;
  accessToken: string;
}

@Processor('indexing')
export class IndexingProcessor {
  private readonly logger = new Logger(IndexingProcessor.name);

  constructor(private readonly repoIndexerService: RepoIndexerService) {}

  /**
   * Process repository indexing job
   * Executed asynchronously by Bull queue
   */
  @Process('index-repository')
  async handleIndexRepository(
    job: Job<IndexRepositoryJobData>,
  ): Promise<string> {
    const { workspaceId, repositoryId, repositoryName, commitSha, accessToken } =
      job.data;

    this.logger.log(
      `Processing indexing job ${job.id}: ${repositoryName}@${commitSha.substring(0, 7)}`,
    );

    try {
      // Update job progress to 0%
      await job.progress(0);

      // Execute indexing
      const indexId = await this.repoIndexerService.index(
        workspaceId,
        repositoryId,
        repositoryName,
        commitSha,
        accessToken,
      );

      // Mark complete
      await job.progress(100);

      this.logger.log(
        `Indexing job ${job.id} completed successfully: ${indexId}`,
      );

      return indexId;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Indexing job ${job.id} failed: ${err.message}`,
        err.stack,
      );
      throw error; // Bull will retry based on configuration
    }
  }

  /**
   * Process re-indexing job (triggered by webhooks)
   */
  @Process('reindex-repository')
  async handleReindexRepository(
    job: Job<IndexRepositoryJobData>,
  ): Promise<string> {
    // Same as index-repository for MVP
    // Future: Can implement incremental re-indexing here
    return this.handleIndexRepository(job);
  }
}
