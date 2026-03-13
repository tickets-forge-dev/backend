import { Folder } from '../../domain/Folder';

export interface FolderRepository {
  save(folder: Folder): Promise<void>;
  findByIdInTeam(folderId: string, teamId: string): Promise<Folder | null>;
  findByTeam(teamId: string): Promise<Folder[]>;
  findByTeamAndName(teamId: string, name: string): Promise<Folder | null>;
  update(folder: Folder): Promise<void>;
  delete(folderId: string, teamId: string): Promise<void>;
  countByTeam(teamId: string): Promise<number>;
}

export const FOLDER_REPOSITORY = Symbol('FolderRepository');
