import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGenerator } from '../../domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../services/TechSpecGeneratorImpl';

/**
 * Input command for finalizing the technical specification
 */
export interface FinalizeSpecCommand {
  aecId: string;
  workspaceId: string;
}

/**
 * FinalizeSpecUseCase - Generate final technical specification
 *
 * Called after all question rounds are complete or user skips to finalize.
 * Generates a comprehensive TechSpec incorporating all accumulated answers.
 *
 * Process:
 * 1. Load AEC aggregate with all question rounds
 * 2. Aggregate all answers from all rounds
 * 3. Build codebase context from AEC repository context
 * 4. Call TechSpecGenerator.generateWithAnswers() with full context
 * 5. Apply LLM retry logic (3 attempts with exponential backoff)
 * 6. Update AEC domain entity with final TechSpec via setTechSpec()
 * 7. Validate spec quality
 * 8. Persist final AEC state
 *
 * The final spec will be much more specific and definitive than the initial
 * spec because it incorporates user answers to clarification questions.
 *
 * Throws:
 * - NotFoundException if AEC not found
 * - BadRequestException if workspace mismatch
 * - Error if LLM fails after 3 retries
 */
@Injectable()
export class FinalizeSpecUseCase {
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
   * Execute the use case: Finalize technical specification
   */
  async execute(command: FinalizeSpecCommand): Promise<AEC> {
    console.log(`✨ [FinalizeSpecUseCase] Finalizing spec for AEC ${command.aecId}`);

    // Load AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new NotFoundException(`AEC ${command.aecId} not found`);
    }

    // Verify workspace ownership
    if (aec.workspaceId !== command.workspaceId) {
      throw new BadRequestException('Workspace mismatch');
    }

    // Aggregate all answers from all rounds
    const allAnswers = this.aggregateAllAnswers(aec);
    console.log(`✨ [FinalizeSpecUseCase] Aggregated ${allAnswers.length} answers from ${aec.questionRounds.length} rounds`);

    // Build codebase context
    const codebaseContext = this.buildCodebaseContext(aec);

    // Generate final spec with retry logic
    const techSpec = await this.generateSpecWithRetry(
      aec.title,
      aec.description,
      codebaseContext,
      allAnswers,
    );

    console.log(`✨ [FinalizeSpecUseCase] Generated final spec with quality score ${techSpec.qualityScore}`);

    // Update AEC with final spec
    aec.setTechSpec(techSpec);

    // Persist changes
    await this.aecRepository.save(aec);

    console.log(`✨ [FinalizeSpecUseCase] Final spec persisted, AEC ready for validation`);

    return aec;
  }

  /**
   * Aggregate all answers from all question rounds
   */
  private aggregateAllAnswers(aec: AEC): Array<{ questionId: string; answer: string | string[] }> {
    const allAnswers: Array<{ questionId: string; answer: string | string[] }> = [];

    for (const round of aec.questionRounds) {
      if (round.answeredAt !== null) {
        for (const [questionId, answer] of Object.entries(round.answers)) {
          allAnswers.push({ questionId, answer });
        }
      }
    }

    return allAnswers;
  }

  /**
   * Build codebase context from AEC repository context
   *
   * In production, fetch real stack, analysis, and files from services.
   */
  private buildCodebaseContext(aec: AEC): any {
    // TODO: Fetch real stack, analysis, and files
    return {
      stack: {},
      analysis: {},
      fileTree: {},
      files: new Map(),
    };
  }

  /**
   * Generate final spec with LLM retry logic
   *
   * Retries up to 3 times with exponential backoff: 1s, 2s, 4s
   */
  private async generateSpecWithRetry(
    title: string,
    description: string | null,
    context: any,
    allAnswers: Array<{ questionId: string; answer: string | string[] }>,
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= FinalizeSpecUseCase.MAX_RETRIES; attempt++) {
      try {
        console.log(`✨ [FinalizeSpecUseCase] Generation attempt ${attempt}/${FinalizeSpecUseCase.MAX_RETRIES}`);

        const spec = await this.techSpecGenerator.generateWithAnswers({
          title,
          description: description ?? undefined,
          context,
          answers: allAnswers,
        });

        console.log(`✨ [FinalizeSpecUseCase] Successfully generated final spec`);
        return spec;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `✨ [FinalizeSpecUseCase] Attempt ${attempt} failed:`,
          lastError.message,
        );

        if (attempt < FinalizeSpecUseCase.MAX_RETRIES) {
          const backoffMs = FinalizeSpecUseCase.INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
          console.log(`✨ [FinalizeSpecUseCase] Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Failed to generate final spec after ${FinalizeSpecUseCase.MAX_RETRIES} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
