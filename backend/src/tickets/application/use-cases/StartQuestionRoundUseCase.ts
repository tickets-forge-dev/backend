import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGenerator, CodebaseContext, ClarificationQuestion } from '../../domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../services/TechSpecGeneratorImpl';

/**
 * Input command for starting a question round
 */
export interface StartQuestionRoundCommand {
  aecId: string;
  workspaceId: string;
  roundNumber: 1 | 2 | 3;
}

/**
 * StartQuestionRoundUseCase - Trigger initial or iterative question generation
 *
 * Orchestrates the process of generating clarification questions for a specific round:
 * 1. Load AEC aggregate from repository
 * 2. Build codebase context (stack, analysis, files)
 * 3. Aggregate previous round answers (if Round 2+)
 * 4. Call TechSpecGenerator with context and prior answers
 * 5. Apply LLM retry logic (3 attempts with exponential backoff)
 * 6. Update AEC domain entity via startQuestionRound()
 * 7. Persist changes to Firestore
 *
 * Throws:
 * - NotFoundException if AEC not found
 * - BadRequestException if invalid state (e.g., trying to start Round 2 without completing Round 1)
 * - Error if LLM fails after 3 retries
 */
@Injectable()
export class StartQuestionRoundUseCase {
  // Retry configuration
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_BACKOFF_MS = 1000;

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(TECH_SPEC_GENERATOR)
    private readonly techSpecGenerator: TechSpecGenerator,
  ) {}

  /**
   * Execute the use case: Start a question round
   */
  async execute(command: StartQuestionRoundCommand): Promise<AEC> {
    console.log(`🎯 [StartQuestionRoundUseCase] Starting round ${command.roundNumber} for AEC ${command.aecId}`);

    // Load AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new NotFoundException(`AEC ${command.aecId} not found`);
    }

    // Verify workspace ownership
    if (aec.workspaceId !== command.workspaceId) {
      throw new BadRequestException('Workspace mismatch');
    }

    // Build codebase context
    const codebaseContext = this.buildCodebaseContext(aec);

    // Aggregate previous round answers for context (if Round 2+)
    const priorAnswers = this.aggregatePriorAnswers(aec, command.roundNumber);

    console.log(`🎯 [StartQuestionRoundUseCase] Generating questions for round ${command.roundNumber}`);

    // Generate questions with retry logic
    const questions = await this.generateQuestionsWithRetry(
      aec.title,
      aec.description,
      codebaseContext,
      priorAnswers,
      command.roundNumber,
    );

    console.log(`🎯 [StartQuestionRoundUseCase] Generated ${questions.length} questions`);

    // Update AEC domain entity
    const contextSnapshot = JSON.stringify(codebaseContext);
    aec.startQuestionRound(command.roundNumber, questions, contextSnapshot);

    // Persist changes
    await this.aecRepository.save(aec);

    console.log(`🎯 [StartQuestionRoundUseCase] Round ${command.roundNumber} started and persisted`);

    return aec;
  }

  /**
   * Build codebase context from AEC repository context
   *
   * This is a simplified context builder. In a real implementation,
   * you would fetch full stack, analysis, and file tree from services.
   */
  private buildCodebaseContext(aec: AEC): CodebaseContext {
    // TODO: Fetch real stack, analysis, and files
    // For now, return minimal context
    return {
      stack: {
        languages: [],
        frameworks: [],
        packageManager: null,
        otherTechnologies: [],
      } as any,
      analysis: {
        architecture: { type: 'unknown' },
        testing: {},
        naming: { files: '', variables: '', classes: '' },
        directories: [],
      } as any,
      fileTree: {} as any,
      files: new Map(),
    };
  }

  /**
   * Aggregate answers from previous rounds to provide context
   */
  private aggregatePriorAnswers(aec: AEC, roundNumber: 1 | 2 | 3): Array<{ questionId: string; answer: string | string[] }> {
    if (roundNumber === 1) {
      return []; // No prior answers for round 1
    }

    const priorAnswers: Array<{ questionId: string; answer: string | string[] }> = [];

    // Collect answers from all previous rounds
    for (const round of aec.questionRounds) {
      if (round.roundNumber < roundNumber) {
        for (const [questionId, answer] of Object.entries(round.answers)) {
          priorAnswers.push({ questionId, answer });
        }
      }
    }

    return priorAnswers;
  }

  /**
   * Generate questions with LLM retry logic
   *
   * Retries up to 3 times with exponential backoff: 1s, 2s, 4s
   */
  private async generateQuestionsWithRetry(
    title: string,
    description: string | null,
    context: CodebaseContext,
    priorAnswers: Array<{ questionId: string; answer: string | string[] }>,
    roundNumber: 1 | 2 | 3,
  ): Promise<ClarificationQuestion[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= StartQuestionRoundUseCase.MAX_RETRIES; attempt++) {
      try {
        console.log(`🎯 [StartQuestionRoundUseCase] Attempt ${attempt}/${StartQuestionRoundUseCase.MAX_RETRIES}`);

        const questions = await this.techSpecGenerator.generateQuestionsWithContext({
          title,
          description: description ?? undefined,
          context,
          priorAnswers,
          roundNumber,
        });

        console.log(`🎯 [StartQuestionRoundUseCase] Successfully generated ${questions.length} questions`);
        return questions;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `🎯 [StartQuestionRoundUseCase] Attempt ${attempt} failed:`,
          lastError.message,
        );

        if (attempt < StartQuestionRoundUseCase.MAX_RETRIES) {
          const backoffMs = StartQuestionRoundUseCase.INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
          console.log(`🎯 [StartQuestionRoundUseCase] Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Failed to generate questions after ${StartQuestionRoundUseCase.MAX_RETRIES} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
