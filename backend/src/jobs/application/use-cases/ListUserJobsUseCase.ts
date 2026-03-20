import { Injectable, Inject, Logger } from '@nestjs/common';
import { JobRepository, JOB_REPOSITORY } from '../ports/JobRepository.port';
import { GenerationJob } from '../../domain/GenerationJob';

export interface ListUserJobsCommand {
  userId: string;
  teamId: string;
}

@Injectable()
export class ListUserJobsUseCase {
  private readonly logger = new Logger(ListUserJobsUseCase.name);

  constructor(
    @Inject(JOB_REPOSITORY) private readonly jobRepository: JobRepository,
  ) {}

  async execute(command: ListUserJobsCommand): Promise<GenerationJob[]> {
    const { userId, teamId } = command;

    // Query recent jobs for user (last 24h)
    const jobs = await this.jobRepository.findRecentByUser(userId, teamId);

    // Opportunistically prune expired jobs (fire-and-forget)
    void this.jobRepository.pruneExpired(teamId).catch((error: Error) => {
      this.logger.warn(`Failed to prune expired jobs for team ${teamId}: ${error.message}`);
    });

    return jobs;
  }
}
