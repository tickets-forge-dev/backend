import { Injectable } from '@nestjs/common';
import { FolderScope } from '../../domain/Folder';
import { FolderRepository } from '../ports/FolderRepository';
import { AECRepository } from '../../../tickets/application/ports/AECRepository';

export interface UpdateFolderScopeCommand {
  teamId: string;
  folderId: string;
  userId: string;
  scope: FolderScope;
  confirm?: boolean;
}

export interface UpdateFolderScopeResult {
  folder?: ReturnType<import('../../domain/Folder').Folder['toObject']>;
  /** Present when team→private change requires confirmation due to foreign tickets */
  confirmationRequired?: boolean;
  affectedTickets?: Array<{ id: string; title: string; createdBy: string }>;
}

@Injectable()
export class UpdateFolderScopeUseCase {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: UpdateFolderScopeCommand): Promise<UpdateFolderScopeResult> {
    const folder = await this.folderRepository.findByIdInTeam(
      command.folderId,
      command.teamId,
    );
    if (!folder) {
      throw new Error(`Folder ${command.folderId} not found`);
    }

    // Authorization: only the creator can change scope
    if (folder.getCreatedBy() !== command.userId) {
      throw new Error('You do not have permission to change this folder\'s scope');
    }

    // No-op if scope is already the target
    if (folder.getScope() === command.scope) {
      return { folder: folder.toObject() };
    }

    // Team → Private: check for foreign tickets
    if (command.scope === 'private') {
      const foreignTickets = await this.aecRepository.findByFolderAndNotCreatedBy(
        command.teamId,
        command.folderId,
        command.userId,
      );

      if (foreignTickets.length > 0 && !command.confirm) {
        // Return confirmation required with affected ticket info
        return {
          confirmationRequired: true,
          affectedTickets: foreignTickets.map((t) => ({
            id: t.id,
            title: t.title,
            createdBy: t.createdBy,
          })),
        };
      }

      if (foreignTickets.length > 0 && command.confirm) {
        // Re-evaluate: eject foreign tickets (set folderId = null)
        const currentForeignTickets = await this.aecRepository.findByFolderAndNotCreatedBy(
          command.teamId,
          command.folderId,
          command.userId,
        );
        for (const ticket of currentForeignTickets) {
          await this.aecRepository.updateTicketFolder(
            ticket.id,
            command.teamId,
            null,
          );
        }
      }
    }

    // Private → Team: just update scope (no special handling needed)

    const updated = folder.updateScope(command.scope);
    await this.folderRepository.update(updated);

    return { folder: updated.toObject() };
  }
}
