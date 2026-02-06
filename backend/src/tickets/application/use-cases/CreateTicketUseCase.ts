import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { GitHubApiService } from '../../../shared/infrastructure/github/github-api.service';
import { GitHubIntegrationRepository, GITHUB_INTEGRATION_REPOSITORY } from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import { RepositoryContext } from '../../domain/value-objects/RepositoryContext';

export interface CreateTicketCommand {
  workspaceId: string;
  title: string;
  description?: string;
  repositoryFullName?: string;
  branchName?: string;
  maxRounds?: number;
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
    console.log('🎫 [CreateTicketUseCase] Creating ticket:', command.title);
    console.log('🎫 [CreateTicketUseCase] WorkspaceId:', command.workspaceId);

    // Build repository context if repository info provided
    let repositoryContext: RepositoryContext | undefined;

    if (command.repositoryFullName && command.branchName) {
      console.log('🎫 [CreateTicketUseCase] Repository context provided:', command.repositoryFullName, '@', command.branchName);

      // Try to fetch GitHub access token from OAuth integration
      // If not available, we'll use on-demand code scanning with env token instead
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(command.workspaceId);

      if (integration) {
        const accessToken = await this.githubTokenService.decryptToken(integration.encryptedAccessToken);
        repositoryContext = await this.buildRepositoryContext(
          command.repositoryFullName,
          command.branchName,
          accessToken,
        );
      } else {
        // No OAuth integration - skip creating context
        // Code will be read on-demand via GitHubFileService (uses GITHUB_TOKEN from env)
        // Repository context will be determined at question round generation time
        console.log('🎫 [CreateTicketUseCase] No GitHub OAuth integration - code will be scanned on-demand');
      }
    }

    // Create domain entity
    const aec = AEC.createDraft(
      command.workspaceId,
      command.title,
      command.description,
      repositoryContext,
      command.maxRounds,
    );

    console.log('🎫 [CreateTicketUseCase] AEC created:', aec.id);

    // Persist draft
    await this.aecRepository.save(aec);

    console.log('🎫 [CreateTicketUseCase] AEC saved, returning draft');

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
    const hasAccess = await this.gitHubApiService.verifyRepositoryAccess(owner, repo, githubAccessToken);
    if (!hasAccess) {
      throw new ForbiddenException(`Repository ${repositoryFullName} not found or access revoked`);
    }

    // Verify branch exists (AC#4)
    const branchExists = await this.gitHubApiService.verifyBranchExists(owner, repo, branchName, githubAccessToken);
    if (!branchExists) {
      throw new BadRequestException(`Branch "${branchName}" not found in ${repositoryFullName}`);
    }

    // Get HEAD commit SHA (AC#4)
    const commitSha = await this.gitHubApiService.getBranchHead(owner, repo, branchName, githubAccessToken);

    // Check if this is the default branch (AC#3)
    const defaultBranch = await this.gitHubApiService.getDefaultBranch(owner, repo, githubAccessToken);
    const isDefaultBranch = branchName === defaultBranch;

    console.log('🎫 [CreateTicketUseCase] Repository context built:', {
      repositoryFullName,
      branchName,
      commitSha: commitSha.substring(0, 7),
      isDefaultBranch,
    });

    return RepositoryContext.create({
      repositoryFullName,
      branchName,
      commitSha,
      isDefaultBranch,
      selectedAt: new Date(),
    });
  }
}
