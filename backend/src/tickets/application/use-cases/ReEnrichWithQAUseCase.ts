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
import { TeamMemberRepository } from '../../../teams/application/ports/TeamMemberRepository';

export interface ReEnrichWithQACommand {
  ticketId: string;
  teamId: string;
  requestingUserId: string;
}

/**
 * ReEnrichWithQAUseCase (Story 7-7)
 *
 * Re-enriches a ticket's tech spec using the developer's Q&A answers.
 * Reuses the existing codebase context from initial enrichment rather than
 * re-fetching from GitHub — the developer's answers are the authoritative
 * source of codebase decisions at this stage.
 *
 * Called when the PM clicks "Approve" after reviewing developer Q&A.
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
    // TODO: Re-enable role check when role management is fully in place
    // if (requestingMember.role !== Role.PM && requestingMember.role !== Role.ADMIN) {
    //   throw new ForbiddenException('Only PMs and Admins can re-enrich tickets');
    // }

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

    // 5. Reuse codebase context from the existing tech spec (already built during
    //    initial enrichment). The developer's Q&A answers are the authoritative
    //    source of codebase decisions at this stage — no need to re-fetch from GitHub.
    const codebaseContext = this.reuseExistingContext(aec);

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
   * Reuse codebase context from the existing tech spec.
   *
   * At re-enrich time, the ticket already went through initial enrichment
   * (which fetched from GitHub) and developer review (which added human
   * codebase knowledge via Q&A). Re-fetching from GitHub would be:
   * - Redundant (context already exists in the spec)
   * - Unreliable (GitHub auth may not be available)
   * - Less accurate (developer's answers supersede static analysis)
   */
  private reuseExistingContext(aec: AEC): CodebaseContext {
    const existingSpec = aec.techSpec;

    if (existingSpec?.stack) {
      // Build a lightweight context from what we already know
      return {
        stack: {
          framework: existingSpec.stack.framework
            ? { name: existingSpec.stack.framework, version: '', majorVersion: 0 }
            : null,
          language: {
            name: existingSpec.stack.language ?? 'unknown',
            detected: !!existingSpec.stack.language,
            confidence: existingSpec.stack.language ? 100 : 0,
          },
          packageManager: { type: (existingSpec.stack.packageManager as 'npm' | 'yarn' | 'pnpm' | 'bun') ?? 'npm' },
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

    return this.minimalContext();
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
