import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
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
import { AECStatus } from '../../../tickets/domain/value-objects/AECStatus';

export interface StartFinalizationCommand {
  ticketId: string;
  userId: string;
  teamId: string;
}

/** Maximum number of concurrent active jobs per user */
const MAX_ACTIVE_JOBS_PER_USER = 3;

@Injectable()
export class StartFinalizationUseCase {
  private readonly logger = new Logger(StartFinalizationUseCase.name);

  constructor(
    @Inject(JOB_REPOSITORY) private readonly jobRepository: JobRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
    @Inject(USAGE_BUDGET_REPOSITORY) private readonly usageBudgetRepository: UsageBudgetRepository,
    @Inject(USER_USAGE_BUDGET_REPOSITORY) private readonly userUsageBudgetRepository: UserUsageBudgetRepository,
    private readonly backgroundFinalizationService: BackgroundFinalizationService,
  ) {}

  async execute(command: StartFinalizationCommand): Promise<{ jobId: string }> {
    const { ticketId, userId, teamId } = command;

    // 1. Load AEC and validate
    const aec = await this.aecRepository.findById(ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    if (aec.teamId !== teamId) {
      throw new ForbiddenException('Ticket does not belong to your team');
    }

    // Validate draft status with answers
    if (aec.status !== AECStatus.DRAFT) {
      throw new ConflictException(`Ticket must be in draft status to finalize, currently: ${aec.status}`);
    }

    // Allow finalization without answers when no questions exist (skip questions mode)
    const answers = aec.questionAnswers;
    const hasQuestions = aec.questions && aec.questions.length > 0;
    if (hasQuestions && (!answers || Object.keys(answers).length === 0)) {
      throw new ConflictException('Ticket must have answered questions before finalizing');
    }

    // 2. Check token budget (quota)
    const month = new Date().toISOString().slice(0, 7);
    const budget = await this.userUsageBudgetRepository.getOrCreate(userId, month);
    if (budget.tokensUsed >= budget.tokenLimit) {
      throw new ForbiddenException({
        message: `Token quota exceeded: ${budget.tokensUsed}/${budget.tokenLimit}`,
        code: 'QUOTA_EXCEEDED',
      });
    }

    // 3. Check for existing active job on this ticket
    const existingJob = await this.jobRepository.findActiveByTicket(ticketId, teamId);
    if (existingJob) {
      throw new ConflictException(
        `Ticket ${ticketId} already has an active generation job: ${existingJob.id}`,
      );
    }

    // 4. Check active job count for user (rate limiting)
    const activeJobs = await this.jobRepository.findActiveByUser(userId, teamId);
    if (activeJobs.length >= MAX_ACTIVE_JOBS_PER_USER) {
      throw new HttpException(
        `Too many active jobs. Maximum ${MAX_ACTIVE_JOBS_PER_USER} concurrent jobs allowed.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 5. Create GenerationJob via domain factory
    const job = GenerationJob.createNew(teamId, ticketId, aec.title, userId);

    // 6. Persist job and link to AEC
    await this.jobRepository.save(job);
    aec.setGenerationJobId(job.id);
    await this.aecRepository.save(aec);

    this.logger.log(`Job ${job.id} created for ticket ${ticketId} by user ${userId}`);

    // 7. Spawn detached async finalization (fire-and-forget)
    void this.backgroundFinalizationService
      .run(job.id, ticketId, teamId)
      .catch((error: Error) => {
        this.logger.error(
          `Background finalization failed for job ${job.id}: ${error.message}`,
        );
      });

    // 8. Return job ID
    return { jobId: job.id };
  }
}
