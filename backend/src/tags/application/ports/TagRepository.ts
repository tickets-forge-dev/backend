import { Tag, TagScope } from '../../domain/Tag';

export interface TagRepository {
  save(tag: Tag): Promise<void>;
  findByIdInTeam(tagId: string, teamId: string): Promise<Tag | null>;
  findByTeam(teamId: string): Promise<Tag[]>;
  findByTeamNameAndScope(
    teamId: string,
    name: string,
    scope: TagScope,
    createdBy?: string,
  ): Promise<Tag | null>;
  update(tag: Tag): Promise<void>;
  delete(tagId: string, teamId: string): Promise<void>;
}

export const TAG_REPOSITORY = Symbol('TagRepository');
