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
import { QuotaExceededError } from '../../../shared/domain/exceptions/DomainExceptions';

export const TICKET_LIMITS: Record<string, number> = {
  'bar.idan@gmail.com': 99999,
};
export const DEFAULT_TICKET_LIMIT = 3;

export interface CreateTicketCommand {
  teamId: string;
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
    // Quota check
    const limit = TICKET_LIMITS[command.userEmail] ?? DEFAULT_TICKET_LIMIT;
    const used = await this.aecRepository.countByTeam(command.teamId);
    if (used >= limit) {
      throw new QuotaExceededError(used, limit);
    }

    // Build repository context if repository info provided
    let repositoryContext: RepositoryContext | undefined;

    if (command.repositoryFullName && command.branchName) {
      // Try to fetch GitHub access token from OAuth integration
      // If not available, we'll use on-demand code scanning with env token instead
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(
        command.teamId,
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
    );

    // Persist taskAnalysis from deep analysis if provided
    if (command.taskAnalysis) {
      aec.setTaskAnalysis(command.taskAnalysis);
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
