import { AEC } from '../../domain/aec/AEC';

export interface AECRepository {
  save(aec: AEC): Promise<void>;
  findById(id: string): Promise<AEC | null>;
  findByIdInTeam(id: string, teamId: string): Promise<AEC | null>;
  findByTeam(teamId: string): Promise<AEC[]>;
  countByTeam(teamId: string): Promise<number>;
  countByTeamAndCreator(teamId: string, createdBy: string): Promise<number>;
  update(aec: AEC): Promise<void>;
  delete(aecId: string, teamId: string): Promise<void>;
}

export const AEC_REPOSITORY = Symbol('AECRepository');
