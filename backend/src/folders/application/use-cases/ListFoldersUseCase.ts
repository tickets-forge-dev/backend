import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../ports/FolderRepository';

export interface ListFoldersCommand {
  teamId: string;
}

@Injectable()
export class ListFoldersUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
  ) {}

  async execute(command: ListFoldersCommand) {
    const folders = await this.folderRepository.findByTeam(command.teamId);

    // Sort alphabetically by name
    folders.sort((a, b) => a.getName().localeCompare(b.getName()));

    return folders.map((f) => f.toObject());
  }
}
