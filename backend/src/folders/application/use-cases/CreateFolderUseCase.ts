import { Injectable } from '@nestjs/common';
import { Folder, FolderScope } from '../../domain/Folder';
import { FolderRepository } from '../ports/FolderRepository';

export interface CreateFolderCommand {
  teamId: string;
  userId: string;
  name: string;
  scope?: FolderScope;
}

@Injectable()
export class CreateFolderUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
  ) {}

  async execute(command: CreateFolderCommand) {
    const scope: FolderScope = command.scope ?? 'team';
    const trimmedName = command.name.trim();

    // Scope-aware uniqueness check:
    // - Team folders: unique among team folders
    // - Private folders: unique per user among their private folders
    const existing = await this.folderRepository.findByTeamNameAndScope(
      command.teamId,
      trimmedName,
      scope,
      scope === 'private' ? command.userId : undefined,
    );
    if (existing) {
      throw new Error(`A folder named "${trimmedName}" already exists in this team`);
    }

    const folder = Folder.create(command.teamId, command.userId, command.name, scope);
    await this.folderRepository.save(folder);

    return folder.toObject();
  }
}
