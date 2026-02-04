import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ExecuteWorkflowUseCase } from '../../application/use-cases/ExecuteWorkflowUseCase';
import { ResumeWorkflowUseCase } from '../../application/use-cases/ResumeWorkflowUseCase';
import {
  ExecuteWorkflowDto,
  ResumeFindingsDto,
  SubmitAnswersDto,
  SkipQuestionsDto,
} from '../dto/WorkflowDto';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';

/**
 * WorkflowController - Ticket Generation Workflow API
 * 
 * Endpoints:
 * - POST /workflows/execute - Start ticket generation workflow
 * - POST /workflows/resume-findings - Resume from findings review
 * - POST /workflows/submit-answers - Submit question answers
 * - POST /workflows/skip-questions - Skip questions
 */
@Controller('workflows')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class WorkflowController {
  constructor(
    private readonly executeWorkflowUseCase: ExecuteWorkflowUseCase,
    private readonly resumeWorkflowUseCase: ResumeWorkflowUseCase,
  ) {}

  /**
   * Start ticket generation workflow
   * 
   * @param workspaceId - User's workspace ID (from JWT)
   * @param dto - Workflow execution parameters
   * @returns Workflow execution result with run ID
   */
  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async executeWorkflow(
    @WorkspaceId() workspaceId: string,
    @Body() dto: ExecuteWorkflowDto,
  ) {
    console.log(`📡 [WorkflowController] Execute workflow: ${dto.aecId}`);

    const result = await this.executeWorkflowUseCase.execute({
      aecId: dto.aecId,
      workspaceId,
    });

    return {
      success: result.success,
      message: result.message,
      data: {
        workflowRunId: result.workflowRunId,
      },
    };
  }

  /**
   * Resume workflow from findings review suspension point
   * 
   * @param workspaceId - User's workspace ID (from JWT)
   * @param dto - Resume action (proceed, edit, cancel)
   * @returns Resume result
   */
  @Post('resume-findings')
  @HttpCode(HttpStatus.OK)
  async resumeFindings(
    @WorkspaceId() workspaceId: string,
    @Body() dto: ResumeFindingsDto,
  ) {
    console.log(`📡 [WorkflowController] Resume from findings: ${dto.action}`);

    const result = await this.resumeWorkflowUseCase.resumeFromFindings({
      aecId: dto.aecId,
      workspaceId,
      action: dto.action,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Submit answers to workflow questions
   * 
   * @param workspaceId - User's workspace ID (from JWT)
   * @param dto - Answers map
   * @returns Submission result
   */
  @Post('submit-answers')
  @HttpCode(HttpStatus.OK)
  async submitAnswers(
    @WorkspaceId() workspaceId: string,
    @Body() dto: SubmitAnswersDto,
  ) {
    console.log(`📡 [WorkflowController] Submit answers for: ${dto.aecId}`);

    const result = await this.resumeWorkflowUseCase.submitAnswers({
      aecId: dto.aecId,
      workspaceId,
      answers: dto.answers,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Skip questions and continue workflow
   * 
   * @param workspaceId - User's workspace ID (from JWT)
   * @param dto - AEC ID
   * @returns Skip result
   */
  @Post('skip-questions')
  @HttpCode(HttpStatus.OK)
  async skipQuestions(
    @WorkspaceId() workspaceId: string,
    @Body() dto: SkipQuestionsDto,
  ) {
    console.log(`📡 [WorkflowController] Skip questions for: ${dto.aecId}`);

    const result = await this.resumeWorkflowUseCase.skipQuestions({
      aecId: dto.aecId,
      workspaceId,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }
}
