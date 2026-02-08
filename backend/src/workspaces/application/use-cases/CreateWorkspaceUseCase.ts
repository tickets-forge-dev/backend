import { Injectable, Inject } from '@nestjs/common';
import { Workspace } from '../../domain/Workspace';
import { WorkspaceRepository, WORKSPACE_REPOSITORY } from '../ports/WorkspaceRepository';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

export interface CreateWorkspaceCommand {
  ownerId: string;
  ownerEmail: string;
}

@Injectable()
export class CreateWorkspaceUseCase {
  constructor(
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly firebaseService: FirebaseService,
  ) {}

  async execute(command: CreateWorkspaceCommand): Promise<Workspace> {
    // Check if workspace already exists
    const existing = await this.workspaceRepository.findByOwnerId(command.ownerId);

    if (existing) {
      return existing;
    }

    // Create workspace
    const workspace = Workspace.create(command.ownerId, command.ownerEmail);

    // Persist
    await this.workspaceRepository.save(workspace);

    // Set custom claims on Firebase user for fast access
    try {
      await this.firebaseService.getAuth().setCustomUserClaims(command.ownerId, {
        workspaceId: workspace.id,
      });

      console.log(`✅ Custom claims set for user ${command.ownerId}: workspaceId=${workspace.id}`);
    } catch (error) {
      console.error('Failed to set custom claims:', error);
      // Don't fail the use case - workspace is created, claims are optimization
    }

    return workspace;
  }
}
