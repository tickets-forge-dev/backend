import { Injectable } from '@nestjs/common';
import { Tag, TagScope, TagColor } from '../../domain/Tag';
import { TagRepository } from '../ports/TagRepository';

export interface CreateTagCommand {
  teamId: string;
  userId: string;
  name: string;
  color: TagColor;
  scope?: TagScope;
}

@Injectable()
export class CreateTagUseCase {
  constructor(
    private readonly tagRepository: TagRepository,
  ) {}

  async execute(command: CreateTagCommand) {
    const scope: TagScope = command.scope ?? 'team';
    const trimmedName = command.name.trim();

    // Scope-aware uniqueness check:
    // - Team tags: unique among team tags
    // - Private tags: unique per user among their private tags
    const existing = await this.tagRepository.findByTeamNameAndScope(
      command.teamId,
      trimmedName,
      scope,
      scope === 'private' ? command.userId : undefined,
    );
    if (existing) {
      throw new Error(`A tag named "${trimmedName}" already exists`);
    }

    const tag = Tag.create(command.teamId, command.userId, command.name, command.color, scope);
    await this.tagRepository.save(tag);

    return tag.toObject();
  }
}
