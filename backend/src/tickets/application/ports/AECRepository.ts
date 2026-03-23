import { AEC } from '../../domain/aec/AEC';

export interface AECRepository {
  save(aec: AEC): Promise<void>;
  findById(id: string): Promise<AEC | null>;
  findByIdInTeam(id: string, teamId: string): Promise<AEC | null>;
  findBySlug(slug: string, teamId: string): Promise<AEC | null>;
  findByTeam(teamId: string): Promise<AEC[]>;
  findArchivedByTeam(teamId: string): Promise<AEC[]>;
  countByTeam(teamId: string): Promise<number>;
  countByTeamAndCreator(teamId: string, createdBy: string): Promise<number>;
  getNextTicketNumber(teamId: string): Promise<number>;
  update(aec: AEC): Promise<void>;
  delete(aecId: string, teamId: string): Promise<void>;
  // Story 12-2: Folder operations
  updateTicketFolder(ticketId: string, teamId: string, folderId: string | null): Promise<void>;
  clearFolderFromTickets(teamId: string, folderId: string): Promise<void>;
  // Folder scope: find tickets in a folder NOT created by a given user
  findByFolderAndNotCreatedBy(
    teamId: string,
    folderId: string,
    userId: string,
  ): Promise<AEC[]>;
}

export const AEC_REPOSITORY = Symbol('AECRepository');
