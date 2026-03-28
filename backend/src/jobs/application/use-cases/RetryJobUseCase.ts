import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JobRepository, JOB_REPOSITORY } from '../ports/JobRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import {
  UsageBudgetRepository,
  USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UsageBudgetRepository';
import {
  UserUsageBudgetRepository,
  USER_USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UserUsageBudgetRepository';
import { GenerationJob } from '../../domain/GenerationJob';
import { BackgroundFinalizationService } from '../services/BackgroundFinalizationService';

export interface RetryJobCommand {
  jobId: string;
  userId: string;
  teamId: string;
}

/** Maximum number of concurrent active jobs per user */
const MAX_ACTIVE_JOBS_PER_USER = 3;

@Injectable()
export class RetryJobUseCase {
  private readonly logger = new Logger(RetryJobUseCase.name);

  constructor(
    @Inject(JOB_REPOSITORY) private readonly jobRepository: JobRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
    @Inject(USAGE_BUDGET_REPOSITORY) private readonly usageBudgetRepository: UsageBudgetRepository,
    @Inject(USER_USAGE_BUDGET_REPOSITORY) private readonly userUsageBudgetRepository: UserUsageBudgetRepository,
    private readonly backgroundFinalizationService: BackgroundFinalizationService,
  ) {}

  async execute(command: RetryJobCommand): Promise<{ jobId: string }> {
    const { jobId, userId, teamId } = command;

    // 1. Load original job and validate
    const originalJob = await this.jobRepository.findById(jobId, teamId);
    if (!originalJob) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (originalJob.createdBy !== userId) {
      throw new ForbiddenException('You can only retry your own jobs');
    }

    if (originalJob.status !== 'failed') {
      throw new ConflictException(
        `Job ${jobId} is not in failed status (status: ${originalJob.status}). Only failed jobs can be retried.`,
      );
    }

    // 2. Check token budget
    const month = new Date().toISOString().slice(0, 7);
    const budget = await this.userUsageBudgetRepository.getOrCreate(userId, month);
    if (budget.tokensUsed >= budget.tokenLimit) {
      throw new ForbiddenException({
        message: `Token quota exceeded: ${budget.tokensUsed}/${budget.tokenLimit}`,
        code: 'QUOTA_EXCEEDED',
      });
    }

    // 3. Check active job count for user
    const activeJobs = await this.jobRepository.findActiveByUser(userId, teamId);
    if (activeJobs.length >= MAX_ACTIVE_JOBS_PER_USER) {
      throw new HttpException(
        `Too many active jobs. Maximum ${MAX_ACTIVE_JOBS_PER_USER} concurrent jobs allowed.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 4. Create NEW job linked to original
    const newJob = GenerationJob.createNew(
      teamId,
      originalJob.ticketId,
      originalJob.ticketTitle,
      userId,
      jobId, // previousJobId
    );

    // 5. Update AEC with new job reference
    const aec = await this.aecRepository.findById(originalJob.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${originalJob.ticketId} not found`);
    }
    aec.setGenerationJobId(newJob.id);
    await this.aecRepository.save(aec);

    // 6. Save the new job
    await this.jobRepository.save(newJob);

    this.logger.log(
      `Retry job ${newJob.id} created for ticket ${originalJob.ticketId} (previous: ${jobId})`,
    );

    // 7. Spawn detached async finalization
    void this.backgroundFinalizationService
      .run(newJob.id, originalJob.ticketId, teamId)
      .catch((error: Error) => {
        this.logger.error(
          `Background finalization failed for retry job ${newJob.id}: ${error.message}`,
        );
      });

    // 8. Return new job ID
    return { jobId: newJob.id };
  }
}
