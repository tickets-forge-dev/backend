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

import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { PRDBreakdownService } from '../services/PRDBreakdownService';
import {
  PRDBreakdownCommand,
  PRDBreakdownResult,
} from '@tickets/domain/prd-breakdown/prd-breakdown.types';

/**
 * Input command for PRD breakdown
 */
export interface PRDBreakdownExecuteCommand extends PRDBreakdownCommand {
  workspaceId: string;
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
      this.logger.log(
        `🔍 Starting PRD breakdown for ${command.repositoryOwner}/${command.repositoryName}`,
      );

      // Validate command
      this.validateCommand(command);

      // Execute breakdown
      const breakdown = await this.prdBreakdownService.breakdown(command);

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

    if (!command.repositoryOwner || !command.repositoryName) {
      throw new BadRequestException('Repository owner and name are required');
    }

    if (!command.workspaceId) {
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
