import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../ports/FolderRepository';
import { AECRepository } from '../../../tickets/application/ports/AECRepository';

export interface MoveTicketToFolderCommand {
  teamId: string;
  ticketId: string;
  folderId: string | null; // null = move to root (unfiled)
  userId: string;
}

@Injectable()
export class MoveTicketToFolderUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: MoveTicketToFolderCommand): Promise<void> {
    // If moving to a folder, verify it exists and belongs to the team
    if (command.folderId) {
      const folder = await this.folderRepository.findByIdInTeam(
        command.folderId,
        command.teamId,
      );
      if (!folder) {
        throw new Error(`Folder ${command.folderId} not found`);
      }

      // Authorization: if target folder is private, only the creator can move tickets into it
      if (folder.getScope() === 'private' && folder.getCreatedBy() !== command.userId) {
        throw new Error('You do not have permission to move tickets into this private folder');
      }
    }

    // Update the ticket's folderId
    await this.aecRepository.updateTicketFolder(
      command.ticketId,
      command.teamId,
      command.folderId,
    );
  }
}
