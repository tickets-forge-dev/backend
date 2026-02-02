import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { GenerationOrchestrator } from '../services/GenerationOrchestrator';
import { GitHubApiService } from '../../../shared/infrastructure/github/github-api.service';
import { RepositoryContext } from '../../domain/value-objects/RepositoryContext';

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
    private readonly gitHubApiService: GitHubApiService,
  ) {}

  async execute(command: CreateTicketCommand): Promise<AEC> {
    console.log('🎫 [CreateTicketUseCase] Creating ticket:', command.title);
    console.log('🎫 [CreateTicketUseCase] WorkspaceId:', command.workspaceId);

    // Build repository context if repository info provided
    let repositoryContext: RepositoryContext | undefined;

    if (command.repositoryFullName && command.branchName) {
      console.log('🎫 [CreateTicketUseCase] Repository context provided:', command.repositoryFullName, '@', command.branchName);
      repositoryContext = await this.buildRepositoryContext(
        command.repositoryFullName,
        command.branchName,
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

    // Trigger 8-step generation process (async - fire and forget)
    // Frontend will subscribe to Firestore for real-time progress
    this.generationOrchestrator.orchestrate(aec).catch((error) => {
      console.error('❌ [CreateTicketUseCase] Generation failed for AEC:', aec.id, error);
      console.error('❌ [CreateTicketUseCase] Error stack:', error.stack);
      // Error is already saved to generationState by orchestrator
    });

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
  ): Promise<RepositoryContext> {
    const [owner, repo] = repositoryFullName.split('/');

    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Expected "owner/repo"');
    }

    // Verify repository access (AC#4)
    const hasAccess = await this.gitHubApiService.verifyRepositoryAccess(owner, repo);
    if (!hasAccess) {
      throw new ForbiddenException(`Repository ${repositoryFullName} not found or access revoked`);
    }

    // Verify branch exists (AC#4)
    const branchExists = await this.gitHubApiService.verifyBranchExists(owner, repo, branchName);
    if (!branchExists) {
      throw new BadRequestException(`Branch "${branchName}" not found in ${repositoryFullName}`);
    }

    // Get HEAD commit SHA (AC#4)
    const commitSha = await this.gitHubApiService.getBranchHead(owner, repo, branchName);

    // Check if this is the default branch (AC#3)
    const defaultBranch = await this.gitHubApiService.getDefaultBranch(owner, repo);
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
