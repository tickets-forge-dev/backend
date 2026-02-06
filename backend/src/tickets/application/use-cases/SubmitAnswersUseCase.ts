import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGenerator, CodebaseContext } from '../../domain/tech-spec/TechSpecGenerator';
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
    console.log(`📋 [SubmitAnswersUseCase] Submitting answers for round ${command.roundNumber} of AEC ${command.aecId}`);

    // Load AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new NotFoundException(`AEC ${command.aecId} not found`);
    }

    // Verify workspace ownership
    if (aec.workspaceId !== command.workspaceId) {
      throw new BadRequestException('Workspace mismatch');
    }

    // Verify current round matches
    if (aec.currentRound !== command.roundNumber) {
      throw new BadRequestException(
        `Round mismatch: expected ${aec.currentRound}, got ${command.roundNumber}`,
      );
    }

    // Record answers in domain entity
    aec.completeQuestionRound(command.roundNumber, command.answers);

    // Decide next action
    const nextAction = await this.decideNextAction(aec, command.roundNumber);

    console.log(`📋 [SubmitAnswersUseCase] Next action: ${nextAction}`);

    // Persist changes
    await this.aecRepository.save(aec);

    console.log(`📋 [SubmitAnswersUseCase] Answers recorded and decision persisted`);

    return {
      aec,
      nextAction,
    };
  }

  /**
   * Decide if more questions should be asked or if we should finalize
   *
   * Hard stop at Round 3 - always finalize at that point.
   * For Rounds 1-2, use LLM decision logic with retry.
   */
  private async decideNextAction(
    aec: AEC,
    roundNumber: number,
  ): Promise<'continue' | 'finalize'> {
    // Hard stop at max rounds
    if (roundNumber >= aec.maxRounds) {
      console.log(`📋 [SubmitAnswersUseCase] Reached maximum ${aec.maxRounds} rounds, forcing finalize`);
      return 'finalize';
    }

    // For Rounds 1-2, ask LLM with retry
    const shouldAskMore = await this.shouldAskMoreQuestionsWithRetry(aec);

    if (shouldAskMore) {
      console.log(`📋 [SubmitAnswersUseCase] LLM decided to ask more questions`);
      return 'continue';
    } else {
      console.log(`📋 [SubmitAnswersUseCase] LLM decided sufficient info gathered, finalize`);
      return 'finalize';
    }
  }

  /**
   * Call LLM to decide if more questions are needed
   *
   * Retries up to 3 times with exponential backoff
   */
  private async shouldAskMoreQuestionsWithRetry(aec: AEC): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= SubmitAnswersUseCase.MAX_RETRIES; attempt++) {
      try {
        console.log(`📋 [SubmitAnswersUseCase] Decision attempt ${attempt}/${SubmitAnswersUseCase.MAX_RETRIES}`);

        // Build context from AEC
        const codebaseContext = await this.buildCodebaseContext(aec);
        const answeredQuestions = this.aggregateAllAnswers(aec);

        // Call LLM decision method
        const shouldAskMore = await this.techSpecGenerator.shouldAskMoreQuestions({
          title: aec.title,
          description: aec.description ?? undefined,
          context: codebaseContext,
          answeredQuestions,
          currentRound: aec.currentRound,
        });

        console.log(`📋 [SubmitAnswersUseCase] LLM decision: shouldAskMore=${shouldAskMore}`);
        return shouldAskMore;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `📋 [SubmitAnswersUseCase] Attempt ${attempt} failed:`,
          lastError.message,
        );

        if (attempt < SubmitAnswersUseCase.MAX_RETRIES) {
          const backoffMs = SubmitAnswersUseCase.INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
          console.log(`📋 [SubmitAnswersUseCase] Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries exhausted - log error but fail gracefully
    // On final failure, default to finalize (safer than asking again)
    console.error(
      `📋 [SubmitAnswersUseCase] Decision LLM failed after retries, defaulting to finalize`,
      lastError,
    );
    return false;
  }

  /**
   * Build codebase context from AEC repository context
   *
   * Fetches real repository data and performs analysis for LLM decision logic
   */
  private async buildCodebaseContext(aec: AEC): Promise<CodebaseContext> {
    const repoContext = aec.repositoryContext;

    if (!repoContext) {
      console.warn('📋 [SubmitAnswersUseCase] No repository context available, using minimal context');
      return {
        stack: {
          framework: null,
          language: { name: 'unknown', detected: false, confidence: 0 },
          packageManager: { type: 'npm' },
          dependencies: [],
          devDependencies: [],
          tooling: {},
          hasWorkspaces: false,
          isMonorepo: false,
        },
        analysis: {
          architecture: { type: 'unknown', confidence: 0, signals: [], directories: [] },
          naming: { files: 'kebab-case', variables: 'camelCase', functions: 'camelCase', classes: 'PascalCase', components: 'PascalCase', confidence: 0 },
          testing: { runner: null, location: 'colocated', namingPattern: '*.test.ts', libraries: [], confidence: 0 },
          stateManagement: { type: 'unknown', packages: [], patterns: [], confidence: 0 },
          apiRouting: { type: 'unknown', baseDirectory: '', conventions: [], confidence: 0 },
          directories: [],
          overallConfidence: 0,
          recommendations: [],
        },
        fileTree: { sha: '', url: '', tree: [], truncated: false },
        files: new Map(),
      };
    }

    try {
      const [owner, repo] = repoContext.repositoryFullName.split('/');
      const fileTree = await this.githubFileService.getTree(owner, repo, repoContext.branchName);

      const filesMap = new Map<string, string>();
      const keyFiles = ['package.json', 'tsconfig.json', 'requirements.txt', 'Dockerfile', 'pom.xml'];

      for (const fileName of keyFiles) {
        try {
          const content = await this.githubFileService.readFile(owner, repo, fileName, repoContext.branchName);
          filesMap.set(fileName, content);
        } catch (error) {
          // File may not exist
        }
      }

      const stack = await this.stackDetector.detectStack(filesMap);
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      return { stack, analysis, fileTree, files: filesMap };
    } catch (error) {
      console.error('📋 [SubmitAnswersUseCase] Error building context:', error instanceof Error ? error.message : String(error));
      return {
        stack: {
          framework: null,
          language: { name: 'unknown', detected: false, confidence: 0 },
          packageManager: { type: 'npm' },
          dependencies: [],
          devDependencies: [],
          tooling: {},
          hasWorkspaces: false,
          isMonorepo: false,
        },
        analysis: {
          architecture: { type: 'unknown', confidence: 0, signals: [], directories: [] },
          naming: { files: 'kebab-case', variables: 'camelCase', functions: 'camelCase', classes: 'PascalCase', components: 'PascalCase', confidence: 0 },
          testing: { runner: null, location: 'colocated', namingPattern: '*.test.ts', libraries: [], confidence: 0 },
          stateManagement: { type: 'unknown', packages: [], patterns: [], confidence: 0 },
          apiRouting: { type: 'unknown', baseDirectory: '', conventions: [], confidence: 0 },
          directories: [],
          overallConfidence: 0,
          recommendations: [],
        },
        fileTree: { sha: '', url: '', tree: [], truncated: false },
        files: new Map(),
      };
    }
  }

  /**
   * Aggregate all answers from all completed rounds
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
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
