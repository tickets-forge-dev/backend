import { Injectable } from '@nestjs/common';
import { TagRepository } from '../ports/TagRepository';
import { AECRepository } from '../../../tickets/application/ports/AECRepository';

export interface DeleteTagCommand {
  teamId: string;
  tagId: string;
  userId: string;
}

@Injectable()
export class DeleteTagUseCase {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: DeleteTagCommand): Promise<void> {
    const tag = await this.tagRepository.findByIdInTeam(
      command.tagId,
      command.teamId,
    );
    if (!tag) {
      throw new Error(`Tag ${command.tagId} not found`);
    }

    // Authorization: if tag is private, only the creator can delete it
    if (tag.getScope() === 'private' && tag.getCreatedBy() !== command.userId) {
      throw new Error('You do not have permission to delete this private tag');
    }

    // Remove this tag ID from all tickets that reference it
    await this.aecRepository.removeTagFromTickets(command.teamId, command.tagId);

    // Delete the tag
    await this.tagRepository.delete(command.tagId, command.teamId);
  }
}
