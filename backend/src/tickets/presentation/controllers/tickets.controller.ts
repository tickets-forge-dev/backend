import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CreateTicketUseCase } from '../../application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from '../../application/use-cases/UpdateAECUseCase';
import { DeleteAECUseCase } from '../../application/use-cases/DeleteAECUseCase';
import { StartQuestionRoundUseCase } from '../../application/use-cases/StartQuestionRoundUseCase';
import { SubmitAnswersUseCase } from '../../application/use-cases/SubmitAnswersUseCase';
import { SkipToFinalizeUseCase } from '../../application/use-cases/SkipToFinalizeUseCase';
import { FinalizeSpecUseCase } from '../../application/use-cases/FinalizeSpecUseCase';
import { CreateTicketDto } from '../dto/CreateTicketDto';
import { UpdateAECDto } from '../dto/UpdateAECDto';
import { StartRoundDto } from '../dto/StartRoundDto';
import { SubmitAnswersDto } from '../dto/SubmitAnswersDto';
import { AECRepository, AEC_REPOSITORY } from '../../application/ports/AECRepository';
import { Inject } from '@nestjs/common';
import { TestAuthGuard } from '../../../shared/presentation/guards/TestAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';

@Controller('tickets')
@UseGuards(TestAuthGuard, WorkspaceGuard) // Using TestAuthGuard for E2E testing
export class TicketsController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly updateAECUseCase: UpdateAECUseCase,
    private readonly deleteAECUseCase: DeleteAECUseCase,
    private readonly startQuestionRoundUseCase: StartQuestionRoundUseCase,
    private readonly submitAnswersUseCase: SubmitAnswersUseCase,
    private readonly skipToFinalizeUseCase: SkipToFinalizeUseCase,
    private readonly finalizeSpecUseCase: FinalizeSpecUseCase,
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateTicketDto,
  ) {
    const aec = await this.createTicketUseCase.execute({
      workspaceId,
      title: dto.title,
      description: dto.description,
      repositoryFullName: dto.repositoryFullName,
      branchName: dto.branchName,
    });

    return this.mapToResponse(aec);
  }

  @Get(':id')
  async getTicket(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const aec = await this.aecRepository.findById(id);
    if (!aec) {
      throw new Error('AEC not found');
    }

    // Verify AEC belongs to user's workspace
    if (aec.workspaceId !== workspaceId) {
      throw new Error('AEC not found'); // Don't reveal it exists in another workspace
    }

    return this.mapToResponse(aec);
  }

  @Get()
  async listTickets(@WorkspaceId() workspaceId: string) {
    const aecs = await this.aecRepository.findByWorkspace(workspaceId);
    return aecs.map((aec) => this.mapToResponse(aec));
  }

  @Patch(':id')
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateAECDto) {
    const aec = await this.updateAECUseCase.execute({
      aecId: id,
      acceptanceCriteria: dto.acceptanceCriteria,
      assumptions: dto.assumptions,
    });

    return this.mapToResponse(aec);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.deleteAECUseCase.execute(id, workspaceId);
  }

  /**
   * Start a question round - triggers initial or iterative question generation
   */
  @Post(':id/start-round')
  async startQuestionRound(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: StartRoundDto,
  ) {
    const aec = await this.startQuestionRoundUseCase.execute({
      aecId: id,
      workspaceId,
      roundNumber: dto.roundNumber,
    });

    return this.mapToResponse(aec);
  }

  /**
   * Submit answers to current round - records answers and decides next action
   */
  @Post(':id/submit-answers')
  async submitAnswers(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
  ) {
    const result = await this.submitAnswersUseCase.execute({
      aecId: id,
      workspaceId,
      roundNumber: dto.roundNumber,
      answers: dto.answers || {},
    });

    return {
      aec: this.mapToResponse(result.aec),
      nextAction: result.nextAction,
    };
  }

  /**
   * Skip remaining rounds - user manual override to finalize immediately
   */
  @Post(':id/skip-to-finalize')
  async skipToFinalize(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const aec = await this.skipToFinalizeUseCase.execute({
      aecId: id,
      workspaceId,
    });

    return this.mapToResponse(aec);
  }

  /**
   * Finalize spec - generate final technical specification with all answers
   */
  @Post(':id/finalize')
  async finalizeSpec(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    const aec = await this.finalizeSpecUseCase.execute({
      aecId: id,
      workspaceId,
    });

    return this.mapToResponse(aec);
  }

  private mapToResponse(aec: any) {
    return {
      id: aec.id,
      workspaceId: aec.workspaceId,
      status: aec.status,
      title: aec.title,
      description: aec.description,
      type: aec.type,
      readinessScore: aec.readinessScore,
      generationState: aec.generationState,
      acceptanceCriteria: aec.acceptanceCriteria,
      assumptions: aec.assumptions,
      repoPaths: aec.repoPaths,
      codeSnapshot: aec.codeSnapshot,
      apiSnapshot: aec.apiSnapshot,
      questions: aec.questions,
      estimate: aec.estimate,
      validationResults: aec.validationResults.map((vr: any) => vr.toPlainObject()),
      externalIssue: aec.externalIssue,
      driftDetectedAt: aec.driftDetectedAt,
      repositoryContext: aec.repositoryContext
        ? {
            repositoryFullName: aec.repositoryContext.repositoryFullName,
            branchName: aec.repositoryContext.branchName,
            commitSha: aec.repositoryContext.commitSha,
            isDefaultBranch: aec.repositoryContext.isDefaultBranch,
            selectedAt: aec.repositoryContext.selectedAt,
          }
        : null,
      // Iterative refinement workflow fields
      questionRounds: aec.questionRounds,
      currentRound: aec.currentRound,
      techSpec: aec.techSpec,
      createdAt: aec.createdAt,
      updatedAt: aec.updatedAt,
    };
  }
}
