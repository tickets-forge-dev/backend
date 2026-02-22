import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGenerator, CodebaseContext } from '../../domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../ports/TechSpecGeneratorPort';
import { CodebaseAnalyzer } from '../../domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '../../domain/stack-detection/ProjectStackDetector';
import { GitHubFileService } from '../../../github/domain/github-file.service';
import { CODEBASE_ANALYZER } from '../ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../ports/ProjectStackDetectorPort';
import { GITHUB_FILE_SERVICE } from '../ports/GitHubFileServicePort';
import { TeamMemberRepository } from '../../../teams/application/ports/TeamMemberRepository';
import { Role } from '../../../teams/domain/Role';

export interface ReEnrichWithQACommand {
  ticketId: string;
  teamId: string;
  requestingUserId: string;
}

/**
 * ReEnrichWithQAUseCase (Story 7-7)
 *
 * Re-enriches a ticket's tech spec and acceptance criteria using the
 * developer's Q&A answers stored in reviewSession.qaItems.
 *
 * Called when the PM clicks "Re-bake Ticket" after reviewing developer Q&A.
 * Status stays WAITING_FOR_APPROVAL — approve is handled by Story 7-8.
 *
 * Pattern mirrors FinalizeSpecUseCase: builds codebase context from
 * repositoryContext (if present), then calls generateWithAnswers().
 */
@Injectable()
export class ReEnrichWithQAUseCase {
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
    @Inject('TeamMemberRepository')
    private readonly teamMemberRepository: TeamMemberRepository,
  ) {}

  async execute(command: ReEnrichWithQACommand): Promise<AEC> {
    // 1. Load ticket
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Verify team ownership
    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your team');
    }

    // 2.5. Verify requesting user has PM or Admin role (re-enrich is PM-only action)
    const requestingMember = await this.teamMemberRepository.findByUserAndTeam(
      command.requestingUserId,
      command.teamId,
    );
    if (!requestingMember || !requestingMember.isActive()) {
      throw new ForbiddenException('You must be an active team member to re-enrich tickets');
    }
    if (requestingMember.role !== Role.PM && requestingMember.role !== Role.ADMIN) {
      throw new ForbiddenException('Only PMs and Admins can re-enrich tickets');
    }

    // 3. Validate review session exists and has Q&A items
    const reviewSession = aec.reviewSession;
    if (!reviewSession || reviewSession.qaItems.length === 0) {
      throw new BadRequestException('No review session found on this ticket');
    }

    // 4. Map Q&A items to AnswerContext (question text used as questionId)
    const answers = reviewSession.qaItems.map((qa) => ({
      questionId: qa.question,
      answer: qa.answer,
    }));

    // 5. Build codebase context (null-safe: works with or without repository)
    const codebaseContext = await this.buildCodebaseContext(aec);

    // 6. Generate updated tech spec with Q&A answers as context
    const techSpec = await this.generateSpecWithRetry(
      aec.title,
      aec.description ?? undefined,
      codebaseContext,
      answers,
    );

    // 7. Apply re-enrichment (updates techSpec + acceptanceCriteria, keeps status)
    aec.reEnrichFromQA(techSpec);

    // 8. Persist
    await this.aecRepository.save(aec);

    return aec;
  }

  /**
   * Generate spec with exponential backoff retry (mirrors FinalizeSpecUseCase pattern)
   */
  private async generateSpecWithRetry(
    title: string,
    description: string | undefined,
    context: CodebaseContext,
    answers: Array<{ questionId: string; answer: string }>,
  ) {
    let lastError: Error | undefined;
    let backoff = ReEnrichWithQAUseCase.INITIAL_BACKOFF_MS;

    for (let attempt = 1; attempt <= ReEnrichWithQAUseCase.MAX_RETRIES; attempt++) {
      try {
        return await this.techSpecGenerator.generateWithAnswers({
          title,
          description,
          context,
          answers,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[ReEnrichWithQAUseCase] Attempt ${attempt}/${ReEnrichWithQAUseCase.MAX_RETRIES} failed:`,
          lastError.message,
        );
        if (attempt < ReEnrichWithQAUseCase.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, backoff));
          backoff *= 2;
        }
      }
    }
    throw lastError ?? new Error('Failed to generate spec after retries');
  }

  /**
   * Build codebase context from ticket's repository context.
   * Returns minimal context when no repository is linked.
   * Mirrors the pattern in FinalizeSpecUseCase.buildCodebaseContext().
   */
  private async buildCodebaseContext(aec: AEC): Promise<CodebaseContext> {
    const repoContext = aec.repositoryContext;

    if (!repoContext) {
      return this.minimalContext();
    }

    try {
      const [owner, repo] = repoContext.repositoryFullName.split('/');

      const fileTree = await this.githubFileService.getTree(owner, repo, repoContext.branchName);

      const filesMap = new Map<string, string>();
      const keyFiles = ['package.json', 'tsconfig.json', 'requirements.txt', 'Dockerfile', 'pom.xml'];

      for (const fileName of keyFiles) {
        try {
          const content = await this.githubFileService.readFile(
            owner,
            repo,
            fileName,
            repoContext.branchName,
          );
          filesMap.set(fileName, content);
        } catch {
          // File may not exist in this repo — skip
        }
      }

      const stack = await this.stackDetector.detectStack(filesMap);
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      return { stack, analysis, fileTree, files: filesMap };
    } catch (error) {
      console.error(
        '[ReEnrichWithQAUseCase] Error building codebase context, falling back to minimal:',
        error instanceof Error ? error.message : String(error),
      );
      return this.minimalContext();
    }
  }

  private minimalContext(): CodebaseContext {
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
