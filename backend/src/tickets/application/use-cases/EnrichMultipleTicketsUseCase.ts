/**
 * EnrichMultipleTicketsUseCase
 *
 * Enriches multiple draft tickets in parallel.
 *
 * Flow:
 * 1. Validate all tickets exist and are in draft state
 * 2. Run Promise.allSettled() for all tickets simultaneously
 * 3. Each ticket: question generation (no deep analysis, reuses existing ticket descriptions)
 * 4. Emit progress events with agentId and ticketId
 * 5. Return questions grouped by ticketId, with any errors
 *
 * Error Handling: If ticket2 fails, ticket1 and ticket3 still complete
 *
 * NOTE: Deep analysis (repo reading) happens per-ticket via DeepAnalysisServiceImpl
 * in the controller. This use case orchestrates parallel question generation.
 */

import { Injectable, BadRequestException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { GenerateQuestionsUseCase } from './GenerateQuestionsUseCase';

/**
 * Progress event emitted during enrichment or finalization
 * Unified type that handles both enrichment phases (deep_analysis, question_generation)
 * and finalization phases (generating_spec, saving)
 */
export interface EnrichmentProgressEvent {
  type: 'progress' | 'complete' | 'error';
  ticketId: string;
  ticketTitle: string;
  agentId: number; // 1, 2, or 3
  phase: 'deep_analysis' | 'question_generation' | 'generating_spec' | 'saving' | 'complete' | 'error';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
  metadata?: {
    currentStep?: string;
    questionCount?: number;
    error?: string;
  };
}

/**
 * Question from enrichment
 */
export interface EnrichedQuestion {
  id: string;
  text: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'select';
  options?: string[];
  required: boolean;
}

/**
 * Result for single ticket enrichment
 */
interface TicketEnrichmentResult {
  ticketId: string;
  questions: EnrichedQuestion[];
  error?: string;
}

/**
 * Command for enrichment
 */
export interface EnrichMultipleCommand {
  workspaceId: string;
  ticketIds: string[];
  onProgress?: (event: EnrichmentProgressEvent) => void;
}

/**
 * Result of enrichment
 */
export interface EnrichMultipleResult {
  questions: Map<string, EnrichedQuestion[]>;
  errors: Map<string, string>;
  completedCount: number;
  failedCount: number;
}

@Injectable()
export class EnrichMultipleTicketsUseCase {
  private readonly logger = new Logger(EnrichMultipleTicketsUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly generateQuestionsUseCase: GenerateQuestionsUseCase,
  ) {}

  /**
   * Execute parallel enrichment
   *
   * @param command Contains workspaceId, ticketIds, and optional progress callback
   * @returns Map of questions by ticketId + errors + counts
   */
  async execute(command: EnrichMultipleCommand): Promise<EnrichMultipleResult> {
    this.logger.log(
      `⚙️ Starting parallel enrichment of ${command.ticketIds.length} tickets`,
    );

    // Validate tickets exist, are drafts, and belong to the workspace
    const tickets = await Promise.all(
      command.ticketIds.map(async (id) => {
        const ticket = await this.aecRepository.findById(id);
        if (!ticket) {
          throw new BadRequestException(`Ticket "${id}" not found`);
        }
        if (ticket.status !== 'draft') {
          throw new BadRequestException(
            `Ticket "${ticket.title}" is not in draft state (status: ${ticket.status})`,
          );
        }
        // Verify ticket belongs to the workspace
        if (ticket.workspaceId !== command.workspaceId) {
          throw new ForbiddenException(
            `Ticket "${ticket.title}" does not belong to your workspace`,
          );
        }
        return { id, ticket };
      }),
    );

    const questionsMap = new Map<string, EnrichedQuestion[]>();
    const errorsMap = new Map<string, string>();

    // Run all question generations in parallel
    const results = await Promise.allSettled(
      tickets.map((item, index) =>
        this.generateQuestionsForTicket(
          item.ticket,
          index + 1, // agentId (1, 2, 3)
          command.workspaceId,
          command.onProgress,
        ),
      ),
    );

    // Process results
    let completedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const ticket = tickets[i];

      if (result.status === 'fulfilled') {
        const enriched = result.value;
        if (enriched.error) {
          errorsMap.set(enriched.ticketId, enriched.error);
          failedCount++;
        } else {
          questionsMap.set(enriched.ticketId, enriched.questions);
          completedCount++;
        }
      } else {
        // Promise was rejected
        const error = result.reason;
        const message =
          error instanceof Error ? error.message : 'Unknown error during enrichment';
        errorsMap.set(ticket.id, message);
        failedCount++;
        this.logger.error(
          `❌ Enrichment failed for ticket ${ticket.id} (${ticket.ticket.title}): ${message}`,
        );
      }
    }

    this.logger.log(
      `⚙️ Enrichment complete: ${completedCount} succeeded, ${failedCount} failed`,
    );

    return {
      questions: questionsMap,
      errors: errorsMap,
      completedCount,
      failedCount,
    };
  }

  /**
   * Generate questions for a single ticket
   * @param agentId 1, 2, or 3 for progress tracking
   */
  private async generateQuestionsForTicket(
    ticket: any,
    agentId: number,
    workspaceId: string,
    onProgress?: (event: EnrichmentProgressEvent) => void,
  ): Promise<TicketEnrichmentResult> {
    const ticketId = ticket.id;
    const ticketTitle = ticket.title;

    try {
      // Progress: question generation started
      this.emitProgress(onProgress, {
        type: 'progress',
        ticketId,
        ticketTitle,
        agentId,
        phase: 'question_generation',
        status: 'started',
        message: `Agent ${agentId} generating clarification questions for "${ticketTitle}"`,
      });

      // Generate questions for this ticket
      const questions = await this.generateQuestionsUseCase.execute({
        aecId: ticketId,
        workspaceId,
      });

      // Progress: complete
      this.emitProgress(onProgress, {
        type: 'progress',
        ticketId,
        ticketTitle,
        agentId,
        phase: 'complete',
        status: 'completed',
        message: `Agent ${agentId} completed enrichment of "${ticketTitle}"`,
        metadata: {
          questionCount: questions.length,
        },
      });

      // Convert to EnrichedQuestion format
      const enrichedQuestions: EnrichedQuestion[] = questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type || 'textarea',
        options: q.options,
        required: true,
      }));

      return {
        ticketId,
        questions: enrichedQuestions,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during enrichment';

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
        `❌ Enrichment failed for ticket ${ticketId} (${ticketTitle}): ${message}`,
      );

      return {
        ticketId,
        questions: [],
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
