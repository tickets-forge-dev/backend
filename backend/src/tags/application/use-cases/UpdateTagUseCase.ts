import { Injectable } from '@nestjs/common';
import { TagRepository } from '../ports/TagRepository';
import { TagColor } from '../../domain/Tag';

export interface UpdateTagCommand {
  teamId: string;
  tagId: string;
  userId: string;
  name?: string;
  color?: TagColor;
}

@Injectable()
export class UpdateTagUseCase {
  constructor(
    private readonly tagRepository: TagRepository,
  ) {}

  async execute(command: UpdateTagCommand) {
    let tag = await this.tagRepository.findByIdInTeam(
      command.tagId,
      command.teamId,
    );
    if (!tag) {
      throw new Error(`Tag ${command.tagId} not found`);
    }

    // Authorization: if tag is private, only the creator can update it
    if (tag.getScope() === 'private' && tag.getCreatedBy() !== command.userId) {
      throw new Error('You do not have permission to update this private tag');
    }

    // Rename if name provided
    if (command.name !== undefined) {
      const trimmedName = command.name.trim();

      // Re-validate name uniqueness within the tag's existing scope
      const existing = await this.tagRepository.findByTeamNameAndScope(
        command.teamId,
        trimmedName,
        tag.getScope(),
        tag.getScope() === 'private' ? tag.getCreatedBy() : undefined,
      );
      if (existing && existing.getId() !== command.tagId) {
        throw new Error(`A tag named "${trimmedName}" already exists`);
      }

      tag = tag.rename(command.name);
    }

    // Recolor if color provided
    if (command.color !== undefined) {
      tag = tag.recolor(command.color);
    }

    await this.tagRepository.update(tag);

    return tag.toObject();
  }
}
