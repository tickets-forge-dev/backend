import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import {
  TechSpecGenerator,
  ClarificationQuestion,
  CodebaseContext,
} from '../../domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../ports/TechSpecGeneratorPort';
import { CodebaseAnalyzer } from '../../domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '../../domain/stack-detection/ProjectStackDetector';
import { GitHubFileService } from '@github/domain/github-file.service';
import { CODEBASE_ANALYZER } from '../ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../ports/ProjectStackDetectorPort';
import { GITHUB_FILE_SERVICE } from '../ports/GitHubFileServicePort';

/**
 * Input command for generating clarification questions
 */
export interface GenerateQuestionsCommand {
  aecId: string;
  workspaceId: string;
}

/**
 * GenerateQuestionsUseCase - Generate up to 5 clarification questions for a ticket
 *
 * Orchestrates the process of generating clarification questions for a ticket:
 * 1. Load AEC aggregate from repository
 * 2. Verify ticket is in draft state
 * 3. Build codebase context (stack, analysis, files)
 * 4. Call TechSpecGenerator to generate up to 5 questions
 * 5. Store questions in AEC domain entity via setQuestions()
 * 6. Persist changes to Firestore
 *
 * Key characteristics:
 * - **Idempotent**: Can be called multiple times, returns same questions
 * - **Best-effort**: If generation fails, returns empty array (skips to finalization)
 * - **Single-call**: Generates all questions in one call (no rounds)
 * - **Up to 5 questions**: LLM constrained to generate max 5 questions
 *
 * Throws:
 * - NotFoundException if AEC not found
 * - BadRequestException if workspace mismatch
 */
@Injectable()
export class GenerateQuestionsUseCase {
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
   * Execute the use case: Generate clarification questions
   */
  async execute(command: GenerateQuestionsCommand): Promise<ClarificationQuestion[]> {
    console.log(`❓ [GenerateQuestionsUseCase] Generating questions for AEC ${command.aecId}`);

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

    // Generate questions with retry logic
    const questions = await this.generateQuestionsWithRetry(
      aec.title,
      aec.description,
      codebaseContext,
    );

    console.log(`❓ [GenerateQuestionsUseCase] Generated ${questions.length} questions`);

    // Store questions in AEC domain entity
    if (questions.length > 0) {
      aec.setQuestions(questions);
      await this.aecRepository.save(aec);
      console.log(`❓ [GenerateQuestionsUseCase] Questions saved to AEC`);
    }

    return questions;
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
      console.warn(
        '❓ [GenerateQuestionsUseCase] No repository context available, using minimal context',
      );
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
          naming: {
            files: 'kebab-case',
            variables: 'camelCase',
            functions: 'camelCase',
            classes: 'PascalCase',
            components: 'PascalCase',
            confidence: 0,
          },
          testing: {
            runner: null,
            location: 'colocated',
            namingPattern: '*.test.ts',
            libraries: [],
            confidence: 0,
          },
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
      console.log(
        `❓ [GenerateQuestionsUseCase] Analyzing repository: ${repoContext.repositoryFullName}`,
      );

      // Step 1: Fetch repository file tree from GitHub
      console.log('❓ [GenerateQuestionsUseCase] Fetching repository tree...');
      const fileTree = await this.githubFileService.getTree(owner, repo, repoContext.branchName);

      // Step 2: Read key files for stack detection
      const filesMap = new Map<string, string>();
      const keyFiles = [
        'package.json',
        'tsconfig.json',
        'requirements.txt',
        'Dockerfile',
        'pom.xml',
      ];

      for (const fileName of keyFiles) {
        try {
          const content = await this.githubFileService.readFile(
            owner,
            repo,
            fileName,
            repoContext.branchName,
          );
          filesMap.set(fileName, content);
          console.log(`❓ [GenerateQuestionsUseCase] Read ${fileName}`);
        } catch (error) {
          // File may not exist, continue
          console.log(`❓ [GenerateQuestionsUseCase] ${fileName} not found (expected)`);
        }
      }

      // Step 3: Detect technology stack
      console.log('❓ [GenerateQuestionsUseCase] Detecting technology stack...');
      const stack = await this.stackDetector.detectStack(filesMap);

      // Step 4: Analyze codebase patterns
      console.log('❓ [GenerateQuestionsUseCase] Analyzing codebase patterns...');
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      console.log(
        `❓ [GenerateQuestionsUseCase] Context built successfully. Stack: ${stack.framework?.name || 'unknown'}`,
      );

      return {
        stack,
        analysis,
        fileTree,
        files: filesMap,
        taskAnalysis: aec.taskAnalysis,
      };
    } catch (error) {
      console.error(
        '❓ [GenerateQuestionsUseCase] Error building codebase context:',
        error instanceof Error ? error.message : String(error),
      );
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
          naming: {
            files: 'kebab-case',
            variables: 'camelCase',
            functions: 'camelCase',
            classes: 'PascalCase',
            components: 'PascalCase',
            confidence: 0,
          },
          testing: {
            runner: null,
            location: 'colocated',
            namingPattern: '*.test.ts',
            libraries: [],
            confidence: 0,
          },
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
   * Generate questions with LLM retry logic
   *
   * Retries up to 3 times with exponential backoff: 1s, 2s, 4s
   * If generation fails completely, returns empty array (best-effort)
   */
  private async generateQuestionsWithRetry(
    title: string,
    description: string | null,
    context: CodebaseContext,
  ): Promise<ClarificationQuestion[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= GenerateQuestionsUseCase.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `❓ [GenerateQuestionsUseCase] Attempt ${attempt}/${GenerateQuestionsUseCase.MAX_RETRIES}`,
        );

        const questions = await this.techSpecGenerator.generateQuestionsWithContext({
          title,
          description: description ?? undefined,
          context,
          priorAnswers: [], // No prior answers for first (and only) call
          roundNumber: 1, // Always round 1 in simplified flow
        });

        console.log(
          `❓ [GenerateQuestionsUseCase] Successfully generated ${questions.length} questions`,
        );
        return questions;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❓ [GenerateQuestionsUseCase] Attempt ${attempt} failed:`, lastError.message);

        if (attempt < GenerateQuestionsUseCase.MAX_RETRIES) {
          const backoffMs = GenerateQuestionsUseCase.INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
          console.log(`❓ [GenerateQuestionsUseCase] Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries exhausted - return empty array (best-effort, skip to finalization)
    console.warn(
      `❓ [GenerateQuestionsUseCase] Failed to generate questions after ${GenerateQuestionsUseCase.MAX_RETRIES} attempts, returning empty array (will skip to finalization)`,
    );
    return [];
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
