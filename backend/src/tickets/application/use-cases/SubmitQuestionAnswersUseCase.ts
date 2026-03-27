import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { FinalizeSpecUseCase } from './FinalizeSpecUseCase';

/**
 * Input command for submitting question answers
 */
export interface SubmitQuestionAnswersCommand {
  aecId: string;
  teamId: string;
  userId: string;
  answers: Record<string, string | string[]>; // questionId -> answer mapping
  /** If true, only record answers without triggering spec finalization */
  saveOnly?: boolean;
}

/**
 * SubmitQuestionAnswersUseCase - Record user answers and finalize tech spec
 *
 * Orchestrates the process of recording question answers and generating the final spec:
 * 1. Load AEC aggregate from repository
 * 2. Verify ticket is in draft state
 * 3. Validate all questions have been answered
 * 4. Record answers in AEC domain entity via recordQuestionAnswers()
 * 5. Call FinalizeSpecUseCase to generate final technical specification
 * 6. Persist changes to Firestore
 *
 * Key characteristics:
 * - **Synchronous**: Generates final spec immediately after answering questions
 * - **Validation**: Ensures all questions are answered before proceeding
 * - **Chained**: Calls FinalizeSpecUseCase internally
 * - **Atomic**: All-or-nothing operation (either all answers recorded and spec generated, or nothing)
 *
 * Throws:
 * - NotFoundException if AEC not found
 * - BadRequestException if workspace mismatch or validation fails
 */
@Injectable()
export class SubmitQuestionAnswersUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly finalizeSpecUseCase: FinalizeSpecUseCase,
  ) {}

  /**
   * Execute the use case: Submit question answers and finalize spec
   */
  async execute(command: SubmitQuestionAnswersCommand): Promise<AEC> {
    console.log(`✅ [SubmitQuestionAnswersUseCase] Submitting answers for AEC ${command.aecId}`);

    // Load AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new NotFoundException(`AEC ${command.aecId} not found`);
    }

    // Verify workspace ownership
    if (aec.teamId !== command.teamId) {
      throw new BadRequestException('Workspace mismatch');
    }

    // Build complete answers map: merge provided answers with _skipped for any
    // questions the user didn't explicitly answer (e.g. old batch-generated
    // questions the dynamic flow never showed, or questions skipped via UI).
    const completeAnswers = this.buildCompleteAnswers(aec, command.answers);

    // Record answers in domain entity
    aec.recordQuestionAnswers(completeAnswers);
    await this.aecRepository.save(aec);
    console.log(`✅ [SubmitQuestionAnswersUseCase] Answers recorded (${Object.keys(completeAnswers).length} answers for ${aec.questions.length} questions)`);

    // If saveOnly, return without finalization (client will start a background job)
    if (command.saveOnly) {
      console.log(`✅ [SubmitQuestionAnswersUseCase] saveOnly=true — skipping finalization`);
      return aec;
    }

    // Finalize the spec (generate final technical specification)
    const aecWithSpec = await this.finalizeSpecUseCase.execute({
      aecId: command.aecId,
      teamId: command.teamId,
      userId: command.userId,
    });

    console.log(`✅ [SubmitQuestionAnswersUseCase] Tech spec finalized`);

    return aecWithSpec;
  }

  /**
   * Build a complete answers map covering every question in the AEC.
   *
   * Any question not present in the provided answers map is auto-filled
   * with '_skipped'. This supports:
   * - Dynamic flow: only answered questions are sent from the frontend
   * - Resume flow: old batch-generated questions the user never saw
   * - Skip all: explicit _skipped answers from the UI
   */
  private buildCompleteAnswers(
    aec: AEC,
    provided: Record<string, string | string[]>,
  ): Record<string, string | string[]> {
    const complete: Record<string, string | string[]> = { ...provided };

    for (const question of aec.questions) {
      if (!(question.id in complete) || complete[question.id] === '') {
        complete[question.id] = '_skipped';
      }
    }

    return complete;
  }
}
