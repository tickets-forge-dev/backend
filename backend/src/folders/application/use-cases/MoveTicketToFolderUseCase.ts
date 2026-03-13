import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../ports/FolderRepository';
import { AECRepository } from '../../../tickets/application/ports/AECRepository';

export interface MoveTicketToFolderCommand {
  teamId: string;
  ticketId: string;
  folderId: string | null; // null = move to root (unfiled)
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
    }

    // Update the ticket's folderId
    await this.aecRepository.updateTicketFolder(
      command.ticketId,
      command.teamId,
      command.folderId,
    );
  }
}

