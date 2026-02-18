import { AEC } from '../../domain/aec/AEC';

export interface AECRepository {
  save(aec: AEC): Promise<void>;
  findById(id: string): Promise<AEC | null>;
  findByWorkspace(workspaceId: string): Promise<AEC[]>;
  countByWorkspace(workspaceId: string): Promise<number>;
  countByWorkspaceAndCreator(workspaceId: string, createdBy: string): Promise<number>;
  update(aec: AEC): Promise<void>;
  delete(aecId: string, workspaceId: string): Promise<void>;
}

export const AEC_REPOSITORY = Symbol('AECRepository');
