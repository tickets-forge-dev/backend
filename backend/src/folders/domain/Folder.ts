import { randomUUID } from 'crypto';

export type FolderScope = 'team' | 'private';

/**
 * Folder - Domain Entity
 *
 * Represents a team-scoped folder for organizing tickets.
 * Folders appear as collapsible sections in the ticket feed.
 * Max hierarchy: root → folder → tickets (no nested folders).
 *
 * Scope determines visibility:
 * - "team": visible to all team members (default)
 * - "private": visible only to the creator
 *
 * Immutable: modifications return new instances.
 */
export class Folder {
  private constructor(
    private readonly id: string,
    private readonly teamId: string,
    private readonly name: string,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
    private readonly scope: FolderScope = 'team',
  ) {}

  static create(teamId: string, createdBy: string, name: string, scope: FolderScope = 'team'): Folder {
    Folder.validateName(name);
    Folder.validateScope(scope);

    if (!teamId || teamId.trim().length === 0) {
      throw new Error('Folder must belong to a team');
    }
    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error('Folder must have a creator');
    }

    const id = `folder_${randomUUID()}`;

    return new Folder(
      id,
      teamId.trim(),
      name.trim(),
      createdBy.trim(),
      new Date(),
      new Date(),
      scope,
    );
  }

  static reconstitute(
    id: string,
    teamId: string,
    name: string,
    createdBy: string,
    createdAt: Date,
    updatedAt: Date,
    scope?: FolderScope,
  ): Folder {
    // Treat missing/undefined scope as "team" for migration support
    return new Folder(id, teamId, name, createdBy, createdAt, updatedAt, scope ?? 'team');
  }

  rename(newName: string): Folder {
    Folder.validateName(newName);
    return new Folder(
      this.id,
      this.teamId,
      newName.trim(),
      this.createdBy,
      this.createdAt,
      new Date(),
      this.scope,
    );
  }

  updateScope(newScope: FolderScope): Folder {
    Folder.validateScope(newScope);
    return new Folder(
      this.id,
      this.teamId,
      this.name,
      this.createdBy,
      this.createdAt,
      new Date(),
      newScope,
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

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  getScope(): FolderScope {
    return this.scope;
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Folder name cannot be empty');
    }
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      throw new Error('Folder name must be between 1 and 100 characters');
    }
  }

  private static validateScope(scope: string): void {
    if (scope !== 'team' && scope !== 'private') {
      throw new Error('Folder scope must be "team" or "private"');
    }
  }

  toObject() {
    return {
      id: this.id,
      teamId: this.teamId,
      name: this.name,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      scope: this.scope,
    };
  }
}
