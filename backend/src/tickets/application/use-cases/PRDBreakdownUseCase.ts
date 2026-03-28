/**
 * PRDBreakdownUseCase
 *
 * Orchestrates the PRD breakdown workflow:
 * 1. Validates PRD text
 * 2. Calls PRDBreakdownService to analyze and break down the PRD
 * 3. Returns structured breakdown ready for frontend review and bulk creation
 *
 * This use case does NOT create tickets - it only returns the breakdown
 * for user review and editing. Tickets are created via BulkCreateFromBreakdownUseCase
 * after user approval.
 */

import { Injectable, BadRequestException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { PRDBreakdownService } from '../services/PRDBreakdownService';
import {
  UsageBudgetRepository,
  USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UsageBudgetRepository';
import {
  UserUsageBudgetRepository,
  USER_USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UserUsageBudgetRepository';
import {
  PRDBreakdownCommand,
  PRDBreakdownResult,
} from '@tickets/domain/prd-breakdown/prd-breakdown.types';

/**
 * Input command for PRD breakdown
 */
export interface PRDBreakdownExecuteCommand extends PRDBreakdownCommand {
  teamId: string;
  userId: string;
  onProgress?: (step: string, message: string) => void;
}

/**
 * Output result of PRD breakdown
 */
export interface PRDBreakdownExecuteResult {
  breakdown: PRDBreakdownResult;
  analysisTime: number;
  estimatedTicketsCount: number;
}

@Injectable()
export class PRDBreakdownUseCase {
  private readonly logger = new Logger(PRDBreakdownUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly prdBreakdownService: PRDBreakdownService,
    @Inject(USAGE_BUDGET_REPOSITORY)
    private readonly usageBudgetRepository: UsageBudgetRepository,
    @Inject(USER_USAGE_BUDGET_REPOSITORY)
    private readonly userUsageBudgetRepository: UserUsageBudgetRepository,
  ) {}

  /**
   * Execute PRD breakdown
   *
   * @param command Contains PRD text, repository info, and workspace
   * @returns Breakdown result with epics, stories, and FR coverage
   * @throws BadRequestException if PRD is invalid
   */
  async execute(command: PRDBreakdownExecuteCommand): Promise<PRDBreakdownExecuteResult> {
    const startTime = Date.now();

    try {
      const repoContext = command.repositoryOwner && command.repositoryName
        ? `${command.repositoryOwner}/${command.repositoryName}`
        : 'no repository';
      this.logger.log(
        `🔍 Starting PRD breakdown for ${repoContext}`,
      );

      // Validate command
      this.validateCommand(command);

      // Check token budget before LLM calls
      const month = new Date().toISOString().slice(0, 7);
      const budget = await this.userUsageBudgetRepository.getOrCreate(command.userId, month);
      if (budget.tokensUsed >= budget.tokenLimit) {
        throw new ForbiddenException({
          message: `Token quota exceeded: ${budget.tokensUsed}/${budget.tokenLimit}`,
          code: 'QUOTA_EXCEEDED',
        });
      }

      // Send initial progress event
      if (command.onProgress) {
        command.onProgress('extracting', 'Extracting functional requirements from PRD...');
      }

      // Execute breakdown
      const breakdown = await this.prdBreakdownService.breakdown(
        {
          ...command,
          onProgress: command.onProgress,
        },
        { teamId: command.teamId, userId: command.userId },
      );

      const analysisTime = Date.now() - startTime;
      const estimatedTicketsCount = breakdown.tickets.length;

      this.logger.log(
        `✅ PRD breakdown complete: ${breakdown.summary.epicCount} epics, ${estimatedTicketsCount} stories in ${analysisTime}ms`,
      );

      return {
        breakdown,
        analysisTime,
        estimatedTicketsCount,
      };
    } catch (error) {
      const analysisTime = Date.now() - startTime;

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`❌ PRD breakdown failed after ${analysisTime}ms: ${error}`);
      throw new BadRequestException(
        `Failed to analyze PRD: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validate the breakdown command
   */
  private validateCommand(command: PRDBreakdownExecuteCommand): void {
    if (!command.prdText || command.prdText.trim().length === 0) {
      throw new BadRequestException('PRD text is required');
    }

    if (!command.teamId) {
      throw new BadRequestException('Workspace ID is required');
    }

    const prdLength = command.prdText.trim().length;
    if (prdLength < 100) {
      throw new BadRequestException(
        `PRD text is too short (${prdLength} chars). Minimum 100 characters required.`,
      );
    }

    if (prdLength > 50000) {
      throw new BadRequestException(
        `PRD text is too long (${prdLength} chars). Maximum 50000 characters allowed.`,
      );
    }
  }
}
