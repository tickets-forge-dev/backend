import { Injectable } from '@nestjs/common';
import { TagRepository } from '../ports/TagRepository';

export interface ListTagsCommand {
  teamId: string;
  userId: string;
}

@Injectable()
export class ListTagsUseCase {
  constructor(
    private readonly tagRepository: TagRepository,
  ) {}

  async execute(command: ListTagsCommand) {
    const tags = await this.tagRepository.findByTeam(command.teamId);

    // Filter by visibility: team tags are visible to all,
    // private tags are visible only to their creator
    const visibleTags = tags.filter(
      (t) => t.getScope() === 'team' || (t.getScope() === 'private' && t.getCreatedBy() === command.userId),
    );

    // Sort alphabetically by name
    visibleTags.sort((a, b) => a.getName().localeCompare(b.getName()));

    return visibleTags.map((t) => t.toObject());
  }
}
