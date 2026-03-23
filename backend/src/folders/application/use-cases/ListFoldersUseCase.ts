import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../ports/FolderRepository';

export interface ListFoldersCommand {
  teamId: string;
  userId: string;
}

@Injectable()
export class ListFoldersUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
  ) {}

  async execute(command: ListFoldersCommand) {
    const folders = await this.folderRepository.findByTeam(command.teamId);

    // Filter by visibility: team folders are visible to all,
    // private folders are visible only to their creator
    const visibleFolders = folders.filter(
      (f) => f.getScope() === 'team' || (f.getScope() === 'private' && f.getCreatedBy() === command.userId),
    );

    // Sort alphabetically by name
    visibleFolders.sort((a, b) => a.getName().localeCompare(b.getName()));

    return visibleFolders.map((f) => f.toObject());
  }
}
