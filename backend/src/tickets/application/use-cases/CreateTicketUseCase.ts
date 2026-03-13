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
  ) {}

  async execute(command: CreateTicketCommand): Promise<AEC> {
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
