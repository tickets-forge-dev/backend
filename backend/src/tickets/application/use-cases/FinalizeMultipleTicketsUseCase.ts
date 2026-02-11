/**
 * FinalizeMultipleTicketsUseCase
 *
 * Finalizes multiple enriched tickets in parallel.
 *
 * Flow:
 * 1. Group answers by ticketId
 * 2. Run Promise.allSettled() for all tickets simultaneously
 * 3. Each ticket: record answers + call FinalizeSpecUseCase
 * 4. Emit progress events with agentId and ticketId
 * 5. Return success/error results for each ticket
 *
 * Error Handling: If ticket2 fails, ticket1 and ticket3 still complete
 */

import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { SubmitQuestionAnswersUseCase } from './SubmitQuestionAnswersUseCase';
import { EnrichmentProgressEvent } from './EnrichMultipleTicketsUseCase';

/**
 * Single answer from user
 */
export interface QuestionAnswer {
  ticketId: string;
  questionId: string;
  answer: string;
}

/**
 * Result for single ticket finalization
 */
interface TicketFinalizationResult {
  ticketId: string;
  ticketTitle: string;
  success: boolean;
  error?: string;
}

/**
 * Command for finalization
 */
export interface FinalizeMultipleCommand {
  answers: QuestionAnswer[];
  onProgress?: (event: EnrichmentProgressEvent) => void;
}

/**
 * Result of finalization
 */
export interface FinalizeMultipleResult {
  results: Array<{
    ticketId: string;
    ticketTitle: string;
    success: boolean;
    error?: string;
  }>;
  completedCount: number;
  failedCount: number;
}

@Injectable()
export class FinalizeMultipleTicketsUseCase {
  private readonly logger = new Logger(FinalizeMultipleTicketsUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly submitQuestionAnswersUseCase: SubmitQuestionAnswersUseCase,
  ) {}

  /**
   * Execute parallel finalization
   *
   * @param command Contains answers grouped by ticketId and optional progress callback
   * @returns Array of results (success/error) per ticket + counts
   */
  async execute(command: FinalizeMultipleCommand): Promise<FinalizeMultipleResult> {
    this.logger.log(`⚙️ Starting parallel finalization`);

    if (!command.answers || command.answers.length === 0) {
      throw new BadRequestException('No answers provided for finalization');
    }

    // Group answers by ticketId
    const answersByTicketId = new Map<string, QuestionAnswer[]>();
    for (const answer of command.answers) {
      if (!answersByTicketId.has(answer.ticketId)) {
        answersByTicketId.set(answer.ticketId, []);
      }
      answersByTicketId.get(answer.ticketId)!.push(answer);
    }

    // Load all tickets
    const tickets = await Promise.all(
      Array.from(answersByTicketId.keys()).map(async (id) => {
        const ticket = await this.aecRepository.findById(id);
        if (!ticket) {
          throw new BadRequestException(`Ticket "${id}" not found`);
        }
        return { id, ticket };
      }),
    );

    // Run all finalizations in parallel
    const results = await Promise.allSettled(
      tickets.map((item, index) =>
        this.finalizeTicket(
          item.ticket,
          index + 1, // agentId (1, 2, 3)
          answersByTicketId.get(item.id) || [],
          command.onProgress,
        ),
      ),
    );

    // Process results
    const resultArray: Array<{
      ticketId: string;
      ticketTitle: string;
      success: boolean;
      error?: string;
    }> = [];
    let completedCount = 0;
    let failedCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const finalized = result.value;
        resultArray.push({
          ticketId: finalized.ticketId,
          ticketTitle: finalized.ticketTitle,
          success: finalized.success,
          error: finalized.error,
        });
        if (finalized.success) {
          completedCount++;
        } else {
          failedCount++;
        }
      } else {
        // Promise was rejected - should not happen, but handle gracefully
        failedCount++;
        const error = result.reason;
        const message =
          error instanceof Error ? error.message : 'Unknown error during finalization';
        this.logger.error(`❌ Finalization promise rejected: ${message}`);
      }
    }

    this.logger.log(
      `⚙️ Finalization complete: ${completedCount} succeeded, ${failedCount} failed`,
    );

    return {
      results: resultArray,
      completedCount,
      failedCount,
    };
  }

  /**
   * Finalize a single ticket (submit answers + generate spec)
   * @param agentId 1, 2, or 3 for progress tracking
   */
  private async finalizeTicket(
    ticket: any,
    agentId: number,
    answers: QuestionAnswer[],
    onProgress?: (event: EnrichmentProgressEvent) => void,
  ): Promise<TicketFinalizationResult> {
    const ticketId = ticket.id;
    const ticketTitle = ticket.title;

    try {
      // Progress: started
      this.emitProgress(onProgress, {
        type: 'progress',
        ticketId,
        ticketTitle,
        agentId,
        phase: 'generating_spec',
        status: 'started',
        message: `Agent ${agentId} generating specification for "${ticketTitle}"`,
      });

      // Convert answers to Record<string, string> format expected by SubmitQuestionAnswersUseCase
      const answerRecord: Record<string, string> = {};
      for (const answer of answers) {
        answerRecord[answer.questionId] = answer.answer;
      }

      // Submit answers and finalize spec
      // The SubmitQuestionAnswersUseCase will:
      // 1. Load the ticket
      // 2. Record answers
      // 3. Call FinalizeSpecUseCase
      // 4. Save the ticket with tech spec
      await this.submitQuestionAnswersUseCase.execute({
        aecId: ticketId,
        workspaceId: ticket.workspaceId,
        answers: answerRecord,
      });

      // Progress: saving (intermediate)
      this.emitProgress(onProgress, {
        type: 'progress',
        ticketId,
        ticketTitle,
        agentId,
        phase: 'saving',
        status: 'in_progress',
        message: `Agent ${agentId} saving specification for "${ticketTitle}"`,
      });

      // Progress: complete
      this.emitProgress(onProgress, {
        type: 'progress',
        ticketId,
        ticketTitle,
        agentId,
        phase: 'complete',
        status: 'completed',
        message: `Agent ${agentId} completed finalization of "${ticketTitle}"`,
      });

      return {
        ticketId,
        ticketTitle,
        success: true,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during finalization';

      this.emitProgress(onProgress, {
        type: 'error',
        ticketId,
        ticketTitle,
        agentId,
        phase: 'error',
        status: 'failed',
        message: `Agent ${agentId} failed: ${message}`,
        metadata: {
          error: message,
        },
      });

      this.logger.error(
        `❌ Finalization failed for ticket ${ticketId} (${ticketTitle}): ${message}`,
      );

      return {
        ticketId,
        ticketTitle,
        success: false,
        error: message,
      };
    }
  }

  /**
   * Emit progress event if callback provided
   */
  private emitProgress(
    callback: ((event: EnrichmentProgressEvent) => void) | undefined,
    event: EnrichmentProgressEvent,
  ) {
    if (callback) {
      callback(event);
    }
  }
}
