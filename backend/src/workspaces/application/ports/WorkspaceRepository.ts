import { Workspace } from '../../domain/Workspace';

export interface WorkspaceRepository {
  save(workspace: Workspace): Promise<void>;
  findById(id: string): Promise<Workspace | null>;
  findByOwnerId(ownerId: string): Promise<Workspace | null>;
}

export const WORKSPACE_REPOSITORY = Symbol('WorkspaceRepository');
