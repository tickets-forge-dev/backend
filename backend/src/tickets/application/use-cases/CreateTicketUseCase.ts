import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { GitHubApiService } from '../../../shared/infrastructure/github/github-api.service';
import {
  GitHubIntegrationRepository,
  GITHUB_INTEGRATION_REPOSITORY,
} from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import { RepositoryContext } from '../../domain/value-objects/RepositoryContext';
import { RepositoryEntry } from '../../domain/value-objects/RepositoryEntry';
import {
  UsageBudgetRepository,
  USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UsageBudgetRepository';
import {
  UserUsageBudgetRepository,
  USER_USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UserUsageBudgetRepository';
import { QuotaExceededError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FirestoreTeamRepository } from '../../../teams/infrastructure/persistence/FirestoreTeamRepository';
import { TeamId } from '../../../teams/domain/TeamId';
export const TICKET_LIMITS: Record<string, number> = {};
export const DEFAULT_TICKET_LIMIT = Infinity;

export interface CreateTicketRepositoryInput {
  repositoryFullName: string;
  branchName: string;
  isPrimary: boolean;
  role?: string;
}

export interface CreateTicketCommand {
  teamId: string;
  workspaceId?: string; // Workspace ID for integration lookups (ws_*)
  userId: string; // Creator's Firebase UID
  userEmail: string;
  title: string;
  description?: string;
  repositoryFullName?: string;
  branchName?: string;
  repositories?: CreateTicketRepositoryInput[]; // Multi-repo (max 2)
  maxRounds?: number;
  type?: 'feature' | 'bug' | 'task';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  taskAnalysis?: any;
  reproductionSteps?: any[];
  folderId?: string | null;
  // Story 14-3: Generation preferences
  includeWireframes?: boolean;
  includeHtmlWireframes?: boolean;
  includeApiSpec?: boolean;
  apiSpecDeferred?: boolean;
  wireframeContext?: string;
  wireframeImageAttachmentIds?: string[];
  apiContext?: string;
}

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly gitHubApiService: GitHubApiService,
    @Inject(GITHUB_INTEGRATION_REPOSITORY)
    private readonly githubIntegrationRepository: GitHubIntegrationRepository,
    private readonly githubTokenService: GitHubTokenService,
    @Inject(USAGE_BUDGET_REPOSITORY)
    private readonly usageBudgetRepository: UsageBudgetRepository,
    @Inject(USER_USAGE_BUDGET_REPOSITORY)
    private readonly userUsageBudgetRepository: UserUsageBudgetRepository,
    private readonly teamRepository: FirestoreTeamRepository,
  ) {}

  async execute(command: CreateTicketCommand): Promise<AEC> {
    // Check quota before creating ticket
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const budget = await this.userUsageBudgetRepository.getOrCreate(command.userId, month);

    if (budget.tokensUsed >= budget.tokenLimit) {
      throw new QuotaExceededError(budget.tokensUsed, budget.tokenLimit);
    }

    // Check daily ticket limit (compare against today, resetting if needed)
    const ticketsToday = budget.lastResetDate === today ? budget.ticketsCreatedToday : 0;
    if (ticketsToday >= budget.dailyTicketLimit) {
      throw new QuotaExceededError(ticketsToday, budget.dailyTicketLimit);
    }

    // Validate multi-repo limit
    if (command.repositories && command.repositories.length > 2) {
      throw new BadRequestException('Maximum 2 repositories per ticket');
    }

    // Resolve GitHub access token (shared by both single- and multi-repo paths)
    let accessToken: string | undefined;
    if (command.workspaceId) {
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(
        command.workspaceId,
      );
      if (integration) {
        accessToken = await this.githubTokenService.decryptToken(
          integration.encryptedAccessToken,
        );
      }
    }

    // Build repository context (single-repo backward compat) or entries (multi-repo)
    let repositoryContext: RepositoryContext | undefined;
    let repositoryEntries: RepositoryEntry[] | undefined;

    if (command.repositories?.length && accessToken) {
      // Multi-repo path: validate each repo, build RepositoryEntry[]
      repositoryEntries = [];
      for (const repo of command.repositories) {
        const entry = await this.buildRepositoryEntry(
          repo.repositoryFullName,
          repo.branchName,
          repo.isPrimary,
          repo.role,
          accessToken,
        );
        repositoryEntries.push(entry);
      }
    } else if (command.repositoryFullName && command.branchName && accessToken) {
      // Single-repo backward-compat path
      repositoryContext = await this.buildRepositoryContext(
        command.repositoryFullName,
        command.branchName,
        accessToken,
      );
    }
    // No OAuth integration or no repo info - code will be read on-demand via GitHubFileService

    // Generate human-friendly slug: {team-slug}-{number}
    let slug: string | undefined;
    try {
      const team = await this.teamRepository.getById(TeamId.create(command.teamId));
      if (team) {
        const teamSlug = team.getSlug();
        const nextNumber = await this.aecRepository.getNextTicketNumber(command.teamId);
        slug = `${teamSlug}-${nextNumber}`;
      }
    } catch (error) {
      // Non-fatal: ticket can still be created without a slug
      console.warn('⚠️ [CreateTicketUseCase] Failed to generate slug:', error);
    }

    // Create domain entity — pass repositoryEntries if multi-repo, otherwise single context
    const aec = AEC.createDraft(
      command.teamId,
      command.userId,
      command.title,
      command.description,
      repositoryEntries ?? repositoryContext,
      command.type,
      command.priority,
      undefined, // assignedTo
      // Story 14-3: Generation preferences
      {
        includeWireframes: command.includeWireframes,
        includeHtmlWireframes: command.includeHtmlWireframes,
        includeApiSpec: command.includeApiSpec,
        apiSpecDeferred: command.apiSpecDeferred,
        wireframeContext: command.wireframeContext,
        wireframeImageAttachmentIds: command.wireframeImageAttachmentIds,
        apiContext: command.apiContext,
      },
      slug,
      command.folderId,
    );

    // Persist taskAnalysis from deep analysis if provided
    if (command.taskAnalysis) {
      aec.setTaskAnalysis(command.taskAnalysis);
    }

    // Persist user-provided reproduction steps for bug tickets
    if (command.reproductionSteps && command.reproductionSteps.length > 0) {
      aec.setReproductionSteps(command.reproductionSteps);
    }

    // Persist draft
    await this.aecRepository.save(aec);

    // Increment daily ticket counter (team-level for analytics + user-level for enforcement)
    await this.usageBudgetRepository.incrementDailyTickets(command.teamId, today);
    await this.userUsageBudgetRepository.incrementDailyTickets(command.userId, today);

    return aec;
  }

  /**
   * Build a single RepositoryEntry for multi-repo tickets.
   * Reuses the same GitHub validation as buildRepositoryContext.
   */
  private async buildRepositoryEntry(
    repositoryFullName: string,
    branchName: string,
    isPrimary: boolean,
    role: string | undefined,
    githubAccessToken: string,
  ): Promise<RepositoryEntry> {
    const [owner, repo] = repositoryFullName.split('/');

    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Expected "owner/repo"');
    }

    // Verify repository access
    const hasAccess = await this.gitHubApiService.verifyRepositoryAccess(
      owner,
      repo,
      githubAccessToken,
    );
    if (!hasAccess) {
      throw new ForbiddenException(`Repository ${repositoryFullName} not found or access revoked`);
    }

    // Verify branch exists
    const branchExists = await this.gitHubApiService.verifyBranchExists(
      owner,
      repo,
      branchName,
      githubAccessToken,
    );
    if (!branchExists) {
      throw new BadRequestException(`Branch "${branchName}" not found in ${repositoryFullName}`);
    }

    // Get HEAD commit SHA
    const commitSha = await this.gitHubApiService.getBranchHead(
      owner,
      repo,
      branchName,
      githubAccessToken,
    );

    // Check if this is the default branch
    const defaultBranch = await this.gitHubApiService.getDefaultBranch(
      owner,
      repo,
      githubAccessToken,
    );

    return {
      repositoryFullName,
      branchName,
      commitSha,
      isDefaultBranch: branchName === defaultBranch,
      isPrimary,
      role,
      selectedAt: new Date(),
    };
  }

  /**
   * Build RepositoryContext by validating and fetching commit SHA
   * AC#3: Store repositoryFullName, branchName, commitSha, isDefaultBranch, selectedAt
   * AC#4: Verify repository access, verify branch exists, capture HEAD commit SHA
   */
  private async buildRepositoryContext(
    repositoryFullName: string,
    branchName: string,
    githubAccessToken: string,
  ): Promise<RepositoryContext> {
    const [owner, repo] = repositoryFullName.split('/');

    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Expected "owner/repo"');
    }

    // Verify repository access (AC#4)
    const hasAccess = await this.gitHubApiService.verifyRepositoryAccess(
      owner,
      repo,
      githubAccessToken,
    );
    if (!hasAccess) {
      throw new ForbiddenException(`Repository ${repositoryFullName} not found or access revoked`);
    }

    // Verify branch exists (AC#4)
    const branchExists = await this.gitHubApiService.verifyBranchExists(
      owner,
      repo,
      branchName,
      githubAccessToken,
    );
    if (!branchExists) {
      throw new BadRequestException(`Branch "${branchName}" not found in ${repositoryFullName}`);
    }

    // Get HEAD commit SHA (AC#4)
    const commitSha = await this.gitHubApiService.getBranchHead(
      owner,
      repo,
      branchName,
      githubAccessToken,
    );

    // Check if this is the default branch (AC#3)
    const defaultBranch = await this.gitHubApiService.getDefaultBranch(
      owner,
      repo,
      githubAccessToken,
    );
    const isDefaultBranch = branchName === defaultBranch;

    return RepositoryContext.create({
      repositoryFullName,
      branchName,
      commitSha,
      isDefaultBranch,
      selectedAt: new Date(),
    });
  }
}
