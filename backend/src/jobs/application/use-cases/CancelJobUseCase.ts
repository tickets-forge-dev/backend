import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JobRepository, JOB_REPOSITORY } from '../ports/JobRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';

export interface CancelJobCommand {
  jobId: string;
  userId: string;
  teamId: string;
}

@Injectable()
export class CancelJobUseCase {
  private readonly logger = new Logger(CancelJobUseCase.name);

  constructor(
    @Inject(JOB_REPOSITORY) private readonly jobRepository: JobRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: CancelJobCommand): Promise<void> {
    const { jobId, userId, teamId } = command;

    // 1. Load job
    const job = await this.jobRepository.findById(jobId, teamId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // 2. Validate ownership
    if (job.createdBy !== userId) {
      throw new ForbiddenException('You can only cancel your own jobs');
    }

    // 3. Validate job is active (running or retrying)
    if (!job.isActive()) {
      throw new ConflictException(
        `Job ${jobId} is not active (status: ${job.status}). Only running or retrying jobs can be cancelled.`,
      );
    }

    // 4. Cancel the job via domain method
    job.markCancelled();

    // 5. Persist job
    await this.jobRepository.save(job);

    this.logger.log(`Job ${jobId} cancelled by user ${userId}`);

    // 6. Clear generation job reference from AEC
    const aec = await this.aecRepository.findById(job.ticketId);
    if (aec) {
      aec.clearGenerationJobId();
      await this.aecRepository.save(aec);
    }
  }
}
