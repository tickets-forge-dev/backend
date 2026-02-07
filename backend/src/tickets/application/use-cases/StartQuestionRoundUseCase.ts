import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGenerator, CodebaseContext, ClarificationQuestion } from '../../domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../ports/TechSpecGeneratorPort';
import { CodebaseAnalyzer } from '../../domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '../../domain/stack-detection/ProjectStackDetector';
import { GitHubFileService } from '@github/domain/github-file.service';
import { CODEBASE_ANALYZER } from '../ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../ports/ProjectStackDetectorPort';
import { GITHUB_FILE_SERVICE } from '../ports/GitHubFileServicePort';

/**
 * Input command for starting a question round
 */
export interface StartQuestionRoundCommand {
  aecId: string;
  workspaceId: string;
  roundNumber: number;
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
    @Inject(CODEBASE_ANALYZER)
    private readonly codebaseAnalyzer: CodebaseAnalyzer,
    @Inject(PROJECT_STACK_DETECTOR)
    private readonly stackDetector: ProjectStackDetector,
    @Inject(GITHUB_FILE_SERVICE)
    private readonly githubFileService: GitHubFileService,
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

    // Build codebase context (fetches from GitHub and analyzes)
    const codebaseContext = await this.buildCodebaseContext(aec);

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

    // CRITICAL: If no questions generated, mark ready for finalization (skip empty rounds)
    if (questions.length === 0) {
      console.log(`🎯 [StartQuestionRoundUseCase] No clarification questions needed - marking ready for finalization`);
      aec.markReadyForFinalization();
      await this.aecRepository.save(aec);
      return aec;
    }

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
   * Fetches real repository data and performs analysis:
   * 1. Fetch repository tree structure from GitHub
   * 2. Detect technology stack (languages, frameworks)
   * 3. Analyze codebase patterns (architecture, testing, naming)
   * 4. Read key configuration files
   *
   * If any step fails, returns partial context with available data
   */
  private async buildCodebaseContext(aec: AEC): Promise<CodebaseContext> {
    const repoContext = aec.repositoryContext;

    // Fallback to minimal context if no repository context
    if (!repoContext) {
      console.warn('🎯 [StartQuestionRoundUseCase] No repository context available, using minimal context');
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
      console.log(`🎯 [StartQuestionRoundUseCase] Analyzing repository: ${repoContext.repositoryFullName}`);

      // Step 1: Fetch repository file tree from GitHub
      console.log('🎯 [StartQuestionRoundUseCase] Fetching repository tree...');
      const fileTree = await this.githubFileService.getTree(owner, repo, repoContext.branchName);

      // Step 2: Read key files for stack detection
      const filesMap = new Map<string, string>();
      const keyFiles = ['package.json', 'tsconfig.json', 'requirements.txt', 'Dockerfile', 'pom.xml'];

      for (const fileName of keyFiles) {
        try {
          const content = await this.githubFileService.readFile(owner, repo, fileName, repoContext.branchName);
          filesMap.set(fileName, content);
          console.log(`🎯 [StartQuestionRoundUseCase] Read ${fileName}`);
        } catch (error) {
          // File may not exist, continue
          console.log(`🎯 [StartQuestionRoundUseCase] ${fileName} not found (expected)`);
        }
      }

      // Step 3: Detect technology stack
      console.log('🎯 [StartQuestionRoundUseCase] Detecting technology stack...');
      const stack = await this.stackDetector.detectStack(filesMap);

      // Step 4: Analyze codebase patterns
      console.log('🎯 [StartQuestionRoundUseCase] Analyzing codebase patterns...');
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      console.log(`🎯 [StartQuestionRoundUseCase] Context built successfully. Stack: ${stack.framework?.name || 'unknown'}`);

      return {
        stack,
        analysis,
        fileTree,
        files: filesMap,
      };
    } catch (error) {
      console.error('🎯 [StartQuestionRoundUseCase] Error building codebase context:', error instanceof Error ? error.message : String(error));
      // Return partial context with minimal valid structure
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
   * Aggregate answers from previous rounds to provide context
   */
  private aggregatePriorAnswers(aec: AEC, roundNumber: number): Array<{ questionId: string; answer: string | string[] }> {
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
    roundNumber: number,
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
