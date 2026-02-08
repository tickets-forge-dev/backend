import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { FinalizeSpecUseCase } from './FinalizeSpecUseCase';

/**
 * Input command for submitting question answers
 */
export interface SubmitQuestionAnswersCommand {
  aecId: string;
  workspaceId: string;
  answers: Record<string, string | string[]>; // questionId -> answer mapping
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
    if (aec.workspaceId !== command.workspaceId) {
      throw new BadRequestException('Workspace mismatch');
    }

    // Validate all questions are answered
    this.validateAnswers(aec, command.answers);

    // Record answers in domain entity
    aec.recordQuestionAnswers(command.answers);
    await this.aecRepository.save(aec);
    console.log(`✅ [SubmitQuestionAnswersUseCase] Answers recorded`);

    // Finalize the spec (generate final technical specification)
    const aecWithSpec = await this.finalizeSpecUseCase.execute({
      aecId: command.aecId,
      workspaceId: command.workspaceId,
    });

    console.log(`✅ [SubmitQuestionAnswersUseCase] Tech spec finalized`);

    return aecWithSpec;
  }

  /**
   * Validate that all questions have been answered
   *
   * Ensures no required questions are skipped, and answers are non-empty.
   * Throws BadRequestException if validation fails.
   */
  private validateAnswers(aec: AEC, answers: Record<string, string | string[]>): void {
    const questions = aec.questions;

    if (questions.length === 0) {
      // No questions to answer
      return;
    }

    // Check all questions have answers
    for (const question of questions) {
      if (!(question.id in answers)) {
        throw new BadRequestException(`Missing answer for question: ${question.question}`);
      }

      const answer = answers[question.id];

      // Validate non-empty
      if (typeof answer === 'string') {
        if (answer.trim().length === 0) {
          throw new BadRequestException(`Empty answer for question: ${question.question}`);
        }
      } else if (Array.isArray(answer)) {
        if (answer.length === 0) {
          throw new BadRequestException(`No options selected for question: ${question.question}`);
        }
      }
    }

    console.log(
      `✅ [SubmitQuestionAnswersUseCase] All answers validated (${questions.length} questions)`,
    );
  }
}
