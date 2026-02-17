import { TeamId } from './TeamId';
import { TeamSettings } from './TeamSettings';
import { InvalidTeamException } from './exceptions/InvalidTeamException';

/**
 * Team - Domain Entity
 *
 * Represents a team with members and workspaces.
 * Enforces invariants: valid name, unique slug, owner exists.
 *
 * Immutable: modifications return new instances.
 */
export class Team {
  private readonly id: TeamId;
  private readonly name: string;
  private readonly slug: string;
  private readonly ownerId: string;
  private readonly settings: TeamSettings;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  private constructor(
    id: TeamId,
    name: string,
    slug: string,
    ownerId: string,
    settings: TeamSettings,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.ownerId = ownerId;
    this.settings = settings;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Factory methods
  static create(
    name: string,
    ownerId: string,
    settings: TeamSettings = TeamSettings.default(),
  ): Team {
    // Validate name
    Team.validateName(name);

    // Validate ownerId
    if (!ownerId || ownerId.trim().length === 0) {
      throw InvalidTeamException.missingOwnerId();
    }

    // Generate slug from name
    const slug = Team.generateSlug(name);

    return new Team(
      TeamId.generate(),
      name.trim(),
      slug,
      ownerId.trim(),
      settings,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(
    id: TeamId,
    name: string,
    slug: string,
    ownerId: string,
    settings: TeamSettings,
    createdAt: Date,
    updatedAt: Date,
  ): Team {
    return new Team(id, name, slug, ownerId, settings, createdAt, updatedAt);
  }

  // Getters
  getId(): TeamId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getSettings(): TeamSettings {
    return this.settings;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // Business logic methods
  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  updateName(newName: string): Team {
    Team.validateName(newName);
    return new Team(
      this.id,
      newName.trim(),
      this.slug,
      this.ownerId,
      this.settings,
      this.createdAt,
      new Date(),
    );
  }

  updateSettings(newSettings: TeamSettings): Team {
    return new Team(
      this.id,
      this.name,
      this.slug,
      this.ownerId,
      newSettings,
      this.createdAt,
      new Date(),
    );
  }

  // Static helpers
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw InvalidTeamException.invalidName(name || '');
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      throw InvalidTeamException.invalidName(name);
    }
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit to 50 chars
  }

  // Serialization
  toObject() {
    return {
      id: this.id.getValue(),
      name: this.name,
      slug: this.slug,
      ownerId: this.ownerId,
      settings: this.settings.toObject(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
