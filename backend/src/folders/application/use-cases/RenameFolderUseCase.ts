import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../ports/FolderRepository';

export interface RenameFolderCommand {
  teamId: string;
  folderId: string;
  name: string;
  userId: string;
}

@Injectable()
export class RenameFolderUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
  ) {}

  async execute(command: RenameFolderCommand) {
    const folder = await this.folderRepository.findByIdInTeam(
      command.folderId,
      command.teamId,
    );
    if (!folder) {
      throw new Error(`Folder ${command.folderId} not found`);
    }

    // Authorization: if folder is private, only the creator can rename it
    if (folder.getScope() === 'private' && folder.getCreatedBy() !== command.userId) {
      throw new Error('You do not have permission to rename this private folder');
    }

    const trimmedName = command.name.trim();

    // Scope-aware uniqueness check
    const existing = await this.folderRepository.findByTeamNameAndScope(
      command.teamId,
      trimmedName,
      folder.getScope(),
      folder.getScope() === 'private' ? folder.getCreatedBy() : undefined,
    );
    if (existing && existing.getId() !== command.folderId) {
      throw new Error(`A folder named "${trimmedName}" already exists in this team`);
    }

    const renamed = folder.rename(command.name);
    await this.folderRepository.update(renamed);

    return renamed.toObject();
  }
}
