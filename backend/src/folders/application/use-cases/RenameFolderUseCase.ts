import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../ports/FolderRepository';

export interface RenameFolderCommand {
  teamId: string;
  folderId: string;
  name: string;
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

    // Check for duplicate name within team
    const existing = await this.folderRepository.findByTeamAndName(
      command.teamId,
      command.name.trim(),
    );
    if (existing && existing.getId() !== command.folderId) {
      throw new Error(`A folder named "${command.name.trim()}" already exists in this team`);
    }

    const renamed = folder.rename(command.name);
    await this.folderRepository.update(renamed);

    return renamed.toObject();
  }
}
