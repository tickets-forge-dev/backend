import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { GenerationOrchestrator } from '../services/GenerationOrchestrator';
import { MastraService } from '../../../shared/infrastructure/mastra/mastra.service';
import { GitHubApiService } from '../../../shared/infrastructure/github/github-api.service';
import { GitHubIntegrationRepository, GITHUB_INTEGRATION_REPOSITORY } from '../../../github/domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import { RepositoryContext } from '../../domain/value-objects/RepositoryContext';

// Feature flag getter - must be called at runtime, not module load time
// ConfigModule loads .env after module imports, so we need to defer reading
const isUsingMastraWorkflow = () => process.env.USE_MASTRA_WORKFLOW === 'true';

export interface CreateTicketCommand {
  workspaceId: string;
  title: string;
  description?: string;
  repositoryFullName?: string;
  branchName?: string;
}

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly generationOrchestrator: GenerationOrchestrator,
    private readonly mastraService: MastraService,
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
      
      // Fetch GitHub access token from integration
      const integration = await this.githubIntegrationRepository.findByWorkspaceId(command.workspaceId);
      if (!integration) {
        throw new ForbiddenException('GitHub not connected. Please connect GitHub in Settings.');
      }

      const accessToken = await this.githubTokenService.decryptToken(integration.encryptedAccessToken);

      repositoryContext = await this.buildRepositoryContext(
        command.repositoryFullName,
        command.branchName,
        accessToken,
      );
    }

    // Create domain entity
    const aec = AEC.createDraft(
      command.workspaceId,
      command.title,
      command.description,
      repositoryContext,
    );

    console.log('🎫 [CreateTicketUseCase] AEC created:', aec.id);

    // Persist draft
    await this.aecRepository.save(aec);

    console.log('🎫 [CreateTicketUseCase] AEC saved, starting generation...');

    // Choose between Mastra workflow (HITL) and legacy orchestrator
    if (isUsingMastraWorkflow()) {
      console.log('🎫 [CreateTicketUseCase] Using Mastra HITL workflow (12-step with suspension points)');
      
      // Execute Mastra workflow (async - fire and forget)
      // Workflow will suspend at critical findings or questions
      this.mastraService.executeTicketGeneration({
        aecId: aec.id,
        workspaceId: command.workspaceId,
      }).then((result) => {
        console.log(`✅ [CreateTicketUseCase] Workflow ${result.status}:`, result);
        if (result.status === 'suspended') {
          console.log(`⏸️ [CreateTicketUseCase] Suspended at: ${result.suspendedAt}`);
        }
      }).catch((error) => {
        console.error('❌ [CreateTicketUseCase] Mastra workflow failed for AEC:', aec.id, error);
      });
    } else {
      console.log('🎫 [CreateTicketUseCase] Using legacy GenerationOrchestrator (8-step sync)');
      
      // Trigger 8-step generation process (async - fire and forget)
      // Frontend will subscribe to Firestore for real-time progress
      this.generationOrchestrator.orchestrate(aec).catch((error) => {
        console.error('❌ [CreateTicketUseCase] Generation failed for AEC:', aec.id, error);
        console.error('❌ [CreateTicketUseCase] Error stack:', error.stack);
        // Error is already saved to generationState by orchestrator
      });
    }

    console.log('🎫 [CreateTicketUseCase] Orchestration started (async), returning AEC');

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

    // Generate indexId from repository name
    const indexId = repositoryFullName.replace('/', '-');

    console.log('🎫 [CreateTicketUseCase] Repository context built:', {
      repositoryFullName,
      branchName,
      commitSha: commitSha.substring(0, 7),
      isDefaultBranch,
      indexId,
    });

    return RepositoryContext.create({
      repositoryFullName,
      branchName,
      commitSha,
      isDefaultBranch,
      selectedAt: new Date(),
      indexId,
    });
  }
}
