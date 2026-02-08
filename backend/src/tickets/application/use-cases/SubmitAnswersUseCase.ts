import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGenerator } from '../../domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../ports/TechSpecGeneratorPort';
import { CodebaseAnalyzer } from '../../domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '../../domain/stack-detection/ProjectStackDetector';
import { GitHubFileService } from '@github/domain/github-file.service';
import { CODEBASE_ANALYZER } from '../ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../ports/ProjectStackDetectorPort';
import { GITHUB_FILE_SERVICE } from '../ports/GitHubFileServicePort';

/**
 * Input command for submitting answers to a question round
 */
export interface SubmitAnswersCommand {
  aecId: string;
  workspaceId: string;
  roundNumber: number;
  answers: Record<string, string | string[]>;
}

/**
 * Output with next action after submitting answers
 */
export interface SubmitAnswersResult {
  aec: AEC;
  nextAction: 'continue' | 'finalize';
}

/**
 * SubmitAnswersUseCase - Accept answers and decide next action
 *
 * Orchestrates the decision point after user answers clarification questions:
 * 1. Load AEC aggregate from repository
 * 2. Call completeQuestionRound() on domain entity to record answers
 * 3. Decide if more questions needed using LLM decision logic
 * 4. Return next action: 'continue' (ask more questions) or 'finalize' (generate spec)
 *
 * Decision Logic:
 * - Hard stop at Round 3 → force finalize
 * - Rounds 1-2 → call shouldAskMoreQuestions() LLM method
 * - If true → continue to next round
 * - If false → finalize spec
 *
 * Throws:
 * - NotFoundException if AEC not found
 * - BadRequestException if invalid state or round mismatch
 * - Error if LLM decision fails after retries
 */
@Injectable()
export class SubmitAnswersUseCase {
  // Retry configuration
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_BACKOFF_MS = 1000;

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(TECH_SPEC_GENERATOR)
    private readonly techSpecGenerator: TechSpecGenerator,
    @Inject(CODEBASE_ANALYZER)
    private readonly codebaseAnalyzer: CodebaseAnalyzer,
    @Inject(PROJECT_STACK_DETECTOR)
    private readonly stackDetector: ProjectStackDetector,
    @Inject(GITHUB_FILE_SERVICE)
    private readonly githubFileService: GitHubFileService,
  ) {}

  /**
   * Execute the use case: Submit answers and decide next action
   */
  async execute(command: SubmitAnswersCommand): Promise<SubmitAnswersResult> {
    console.log(
      `📋 [SubmitAnswersUseCase] Submitting answers for round ${command.roundNumber} of AEC ${command.aecId}`,
    );

    // Load AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new NotFoundException(`AEC ${command.aecId} not found`);
    }

    // Verify workspace ownership
    if (aec.workspaceId !== command.workspaceId) {
      throw new BadRequestException('Workspace mismatch');
    }

    // Record answers in domain entity (simplified flow - no round tracking)
    aec.recordQuestionAnswers(command.answers);

    // In simplified flow, always finalize (no more rounds)
    const nextAction = 'finalize' as const;

    console.log(`📋 [SubmitAnswersUseCase] Next action: ${nextAction}`);

    // Persist changes
    await this.aecRepository.save(aec);

    console.log(`📋 [SubmitAnswersUseCase] Answers recorded and decision persisted`);

    return {
      aec,
      nextAction,
    };
  }
}
