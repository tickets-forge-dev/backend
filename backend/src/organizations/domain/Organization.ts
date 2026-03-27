import { OrganizationId } from './OrganizationId';

export type OrganizationType = 'personal' | 'company';

/**
 * Organization - Domain Entity
 *
 * Represents an organization that owns teams and resources.
 * Enforces invariants: valid name, unique slug, owner exists.
 *
 * Immutable: modifications return new instances.
 */
export class Organization {
  private readonly id: OrganizationId;
  private readonly name: string;
  private readonly slug: string;
  private readonly ownerId: string;
  private readonly type: OrganizationType;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  private constructor(
    id: OrganizationId,
    name: string,
    slug: string,
    ownerId: string,
    type: OrganizationType,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.ownerId = ownerId;
    this.type = type;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Factory methods
  static create(
    name: string,
    ownerId: string,
    type: OrganizationType,
  ): Organization {
    Organization.validateName(name);

    if (!ownerId || ownerId.trim().length === 0) {
      throw new Error('Organization ownerId is required');
    }

    const slug = Organization.generateSlug(name);

    return new Organization(
      OrganizationId.generate(),
      name.trim(),
      slug,
      ownerId.trim(),
      type,
      new Date(),
      new Date(),
    );
  }

  /**
   * Convenience factory for personal organizations.
   * Creates an org named "${displayName}'s Workspace" with type 'personal'.
   */
  static createPersonal(ownerId: string, displayName: string): Organization {
    const name = `${displayName}'s Workspace`;
    return Organization.create(name, ownerId, 'personal');
  }

  static reconstitute(
    id: OrganizationId,
    name: string,
    slug: string,
    ownerId: string,
    type: OrganizationType,
    createdAt: Date,
    updatedAt: Date,
  ): Organization {
    return new Organization(id, name, slug, ownerId, type, createdAt, updatedAt);
  }

  // Getters
  getId(): OrganizationId {
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

  getType(): OrganizationType {
    return this.type;
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

  isPersonal(): boolean {
    return this.type === 'personal';
  }

  updateName(newName: string): Organization {
    Organization.validateName(newName);
    const trimmedName = newName.trim();
    const newSlug = Organization.generateSlug(trimmedName);
    return new Organization(
      this.id,
      trimmedName,
      newSlug,
      this.ownerId,
      this.type,
      this.createdAt,
      new Date(),
    );
  }

  // Static helpers
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Organization name is required');
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      throw new Error(
        `Organization name must be between 3 and 50 characters, got ${trimmedName.length}`,
      );
    }
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  // Serialization
  toObject() {
    return {
      id: this.id.getValue(),
      name: this.name,
      slug: this.slug,
      ownerId: this.ownerId,
      type: this.type,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
