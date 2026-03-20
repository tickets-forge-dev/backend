import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { StartFinalizationUseCase } from '../../application/use-cases/StartFinalizationUseCase';
import { CancelJobUseCase } from '../../application/use-cases/CancelJobUseCase';
import { RetryJobUseCase } from '../../application/use-cases/RetryJobUseCase';
import { ListUserJobsUseCase } from '../../application/use-cases/ListUserJobsUseCase';
import { StartFinalizationDto } from '../dto/StartFinalizationDto';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';
import { UserId } from '../../../shared/presentation/decorators/UserId.decorator';

@Controller('jobs')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class JobsController {
  constructor(
    private readonly startFinalizationUseCase: StartFinalizationUseCase,
    private readonly cancelJobUseCase: CancelJobUseCase,
    private readonly retryJobUseCase: RetryJobUseCase,
    private readonly listUserJobsUseCase: ListUserJobsUseCase,
  ) {}

  @Post('start')
  async startFinalization(
    @Body() dto: StartFinalizationDto,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<{ jobId: string }> {
    return this.startFinalizationUseCase.execute({
      ticketId: dto.ticketId,
      userId,
      teamId,
    });
  }

  @Post(':jobId/cancel')
  @HttpCode(204)
  async cancelJob(
    @Param('jobId') jobId: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<void> {
    await this.cancelJobUseCase.execute({ jobId, userId, teamId });
  }

  @Post(':jobId/retry')
  async retryJob(
    @Param('jobId') jobId: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<{ jobId: string }> {
    return this.retryJobUseCase.execute({ jobId, userId, teamId });
  }

  @Get()
  async listJobs(
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.listUserJobsUseCase.execute({ userId, teamId });
  }
}
