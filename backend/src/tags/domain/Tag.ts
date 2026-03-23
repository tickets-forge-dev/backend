import { randomUUID } from 'crypto';

export type TagScope = 'team' | 'private';

export const VALID_TAG_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
] as const;

export type TagColor = (typeof VALID_TAG_COLORS)[number];

/**
 * Tag - Domain Entity
 *
 * Represents a colored label for organizing tickets.
 * Tags can be team-scoped (visible to all) or private (visible only to creator).
 *
 * Scope is immutable after creation (delete and recreate to change scope).
 *
 * Immutable: modifications return new instances.
 */
export class Tag {
  private constructor(
    private readonly id: string,
    private readonly teamId: string,
    private readonly name: string,
    private readonly color: TagColor,
    private readonly scope: TagScope,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(
    teamId: string,
    createdBy: string,
    name: string,
    color: TagColor,
    scope: TagScope = 'team',
  ): Tag {
    Tag.validateName(name);
    Tag.validateColor(color);
    Tag.validateScope(scope);

    if (!teamId || teamId.trim().length === 0) {
      throw new Error('Tag must belong to a team');
    }
    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error('Tag must have a creator');
    }

    const id = `tag_${randomUUID()}`;

    return new Tag(
      id,
      teamId.trim(),
      name.trim(),
      color,
      scope,
      createdBy.trim(),
      new Date(),
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    teamId: string,
    name: string,
    color: TagColor,
    scope: TagScope | undefined,
    createdBy: string,
    createdAt: Date,
    updatedAt: Date,
  ): Tag {
    // Treat missing/undefined scope as "team" for migration support
    return new Tag(
      id,
      teamId,
      name,
      color,
      scope ?? 'team',
      createdBy,
      createdAt,
      updatedAt,
    );
  }

  rename(newName: string): Tag {
    Tag.validateName(newName);
    return new Tag(
      this.id,
      this.teamId,
      newName.trim(),
      this.color,
      this.scope,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }

  recolor(newColor: TagColor): Tag {
    Tag.validateColor(newColor);
    return new Tag(
      this.id,
      this.teamId,
      this.name,
      newColor,
      this.scope,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getTeamId(): string {
    return this.teamId;
  }

  getName(): string {
    return this.name;
  }

  getColor(): TagColor {
    return this.color;
  }

  getScope(): TagScope {
    return this.scope;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      throw new Error('Tag name must be between 1 and 50 characters');
    }
  }

  private static validateColor(color: string): void {
    if (!VALID_TAG_COLORS.includes(color as TagColor)) {
      throw new Error(
        `Tag color must be one of: ${VALID_TAG_COLORS.join(', ')}`,
      );
    }
  }

  private static validateScope(scope: string): void {
    if (scope !== 'team' && scope !== 'private') {
      throw new Error('Tag scope must be "team" or "private"');
    }
  }

  toObject() {
    return {
      id: this.id,
      teamId: this.teamId,
      name: this.name,
      color: this.color,
      scope: this.scope,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
