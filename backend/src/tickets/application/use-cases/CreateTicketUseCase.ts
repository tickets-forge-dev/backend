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
import {
  UsageBudgetRepository,
  USAGE_BUDGET_REPOSITORY,
} from '../../../shared/application/ports/UsageBudgetRepository';
import { QuotaExceededError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FirestoreTeamRepository } from '../../../teams/infrastructure/persistence/FirestoreTeamRepository';
import { TeamId } from '../../../teams/domain/TeamId';
export const TICKET_LIMITS: Record<string, number> = {};
export const DEFAULT_TICKET_LIMIT = Infinity;

export interface CreateTicketCommand {
  teamId: string;
  workspaceId?: string; // Workspace ID for integration lookups (ws_*)
  userId: string; // Creator's Firebase UID
  userEmail: string;
  title: string;
  description?: string;
  repositoryFullName?: string;
  branchName?: string;
  maxRounds?: number;
  type?: 'feature' | 'bug' | 'task';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  taskAnalysis?: any;
  reproductionSteps?: any[];
  folderId?: string | null;
  // Story 14-3: Generation preferences
  includeWireframes?: boolean;
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
    private readonly teamRepository: FirestoreTeamRepository,
  ) {}

  async execute(command: CreateTicketCommand): Promise<AEC> {
    // Check quota before creating ticket
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const budget = await this.usageBudgetRepository.getOrCreate(command.teamId, month);

    if (budget.tokensUsed >= budget.tokenLimit) {
      throw new QuotaExceededError(budget.tokensUsed, budget.tokenLimit);
    }

    // Check daily ticket limit (compare against today, resetting if needed)
    const ticketsToday = budget.lastResetDate === today ? budget.ticketsCreatedToday : 0;
    if (ticketsToday >= budget.dailyTicketLimit) {
      throw new QuotaExceededError(ticketsToday, budget.dailyTicketLimit);
    }

    // Build repository context if repository info provided
    let repositoryContext: RepositoryContext | undefined;

    if (command.repositoryFullName && command.branchName && command.workspaceId) {
      // Try to fetch GitHub access token from OAuth integration
      // Uses workspaceId (ws_*) — not teamId — to look up the integration
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(
        command.workspaceId,
      );

      if (integration) {
        const accessToken = await this.githubTokenService.decryptToken(
          integration.encryptedAccessToken,
        );
        repositoryContext = await this.buildRepositoryContext(
          command.repositoryFullName,
          command.branchName,
          accessToken,
        );
      }
      // No OAuth integration - code will be read on-demand via GitHubFileService
    }

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

    // Create domain entity
    const aec = AEC.createDraft(
      command.teamId,
      command.userId,
      command.title,
      command.description,
      repositoryContext,
      command.type,
      command.priority,
      undefined, // assignedTo
      // Story 14-3: Generation preferences
      {
        includeWireframes: command.includeWireframes,
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

    // Increment daily ticket counter
    await this.usageBudgetRepository.incrementDailyTickets(command.teamId, today);

    return aec;
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
