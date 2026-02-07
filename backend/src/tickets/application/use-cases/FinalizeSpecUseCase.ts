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
    @Inject(CODEBASE_ANALYZER)
    private readonly codebaseAnalyzer: CodebaseAnalyzer,
    @Inject(PROJECT_STACK_DETECTOR)
    private readonly stackDetector: ProjectStackDetector,
    @Inject(GITHUB_FILE_SERVICE)
    private readonly githubFileService: GitHubFileService,
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

    // Get question answers (single set, no rounds)
    const answersRecord = aec.questionAnswers;
    const allAnswers = Object.entries(answersRecord).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    console.log(`✨ [FinalizeSpecUseCase] Aggregated ${allAnswers.length} answers`);

    // Build codebase context (fetches from GitHub and analyzes)
    const codebaseContext = await this.buildCodebaseContext(aec);

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
   * Build codebase context from AEC repository context
   *
   * Fetches real repository data and performs analysis for final spec generation
   */
  private async buildCodebaseContext(aec: AEC): Promise<CodebaseContext> {
    const repoContext = aec.repositoryContext;

    if (!repoContext) {
      console.warn('✨ [FinalizeSpecUseCase] No repository context available, using minimal context');
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
      console.log(`✨ [FinalizeSpecUseCase] Analyzing repository for final spec: ${repoContext.repositoryFullName}`);

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

      console.log(`✨ [FinalizeSpecUseCase] Repository context built with framework: ${stack.framework?.name || 'unknown'}`);
      return { stack, analysis, fileTree, files: filesMap };
    } catch (error) {
      console.error('✨ [FinalizeSpecUseCase] Error building context:', error instanceof Error ? error.message : String(error));
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
