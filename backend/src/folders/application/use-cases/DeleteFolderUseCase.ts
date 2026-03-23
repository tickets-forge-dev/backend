import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../ports/FolderRepository';
import { AECRepository } from '../../../tickets/application/ports/AECRepository';

export interface DeleteFolderCommand {
  teamId: string;
  folderId: string;
  userId: string;
}

@Injectable()
export class DeleteFolderUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: DeleteFolderCommand): Promise<void> {
    const folder = await this.folderRepository.findByIdInTeam(
      command.folderId,
      command.teamId,
    );
    if (!folder) {
      throw new Error(`Folder ${command.folderId} not found`);
    }

    // Authorization: if folder is private, only the creator can delete it
    if (folder.getScope() === 'private' && folder.getCreatedBy() !== command.userId) {
      throw new Error('You do not have permission to delete this private folder');
    }

    // Move all tickets in this folder back to root (set folderId to null)
    await this.aecRepository.clearFolderFromTickets(command.teamId, command.folderId);

    // Delete the folder
    await this.folderRepository.delete(command.folderId, command.teamId);
  }
}
