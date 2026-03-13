import { Injectable } from '@nestjs/common';
import { Folder } from '../../domain/Folder';
import { FolderRepository } from '../ports/FolderRepository';

export interface CreateFolderCommand {
  teamId: string;
  userId: string;
  name: string;
}

@Injectable()
export class CreateFolderUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
  ) {}

  async execute(command: CreateFolderCommand) {
    // Check for duplicate name within team
    const existing = await this.folderRepository.findByTeamAndName(
      command.teamId,
      command.name.trim(),
    );
    if (existing) {
      throw new Error(`A folder named "${command.name.trim()}" already exists in this team`);
    }

    const folder = Folder.create(command.teamId, command.userId, command.name);
    await this.folderRepository.save(folder);

    return folder.toObject();
  }
}
