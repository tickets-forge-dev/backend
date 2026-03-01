import { randomUUID } from 'crypto';

/**
 * Folder - Domain Entity
 *
 * Represents a team-scoped folder for organizing tickets.
 * Folders appear as collapsible sections in the ticket feed.
 * Max hierarchy: root → folder → tickets (no nested folders).
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
  ) {}

  static create(teamId: string, createdBy: string, name: string): Folder {
    Folder.validateName(name);

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
    );
  }

  static reconstitute(
    id: string,
    teamId: string,
    name: string,
    createdBy: string,
    createdAt: Date,
    updatedAt: Date,
  ): Folder {
    return new Folder(id, teamId, name, createdBy, createdAt, updatedAt);
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

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Folder name cannot be empty');
    }
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      throw new Error('Folder name must be between 1 and 100 characters');
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
    };
  }
}
