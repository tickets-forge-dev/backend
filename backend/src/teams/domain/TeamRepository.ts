/**
 * TeamRepository — Value Object
 *
 * Represents a repository configured for a team/project.
 * Immutable: modifications return new instances.
 */

export type RepositoryRole = 'backend' | 'frontend' | 'shared';

export class TeamRepository {
  readonly repositoryFullName: string;
  readonly role: RepositoryRole;
  readonly defaultBranch: string;
  readonly profileId: string | null;
  readonly addedBy: string;
  readonly addedAt: Date;

  private constructor(
    repositoryFullName: string,
    role: RepositoryRole,
    defaultBranch: string,
    profileId: string | null,
    addedBy: string,
    addedAt: Date,
  ) {
    this.repositoryFullName = repositoryFullName;
    this.role = role;
    this.defaultBranch = defaultBranch;
    this.profileId = profileId;
    this.addedBy = addedBy;
    this.addedAt = addedAt;
  }

  static create(
    repositoryFullName: string,
    role: RepositoryRole,
    defaultBranch: string,
    addedBy: string,
    profileId?: string,
  ): TeamRepository {
    if (!repositoryFullName || !repositoryFullName.includes('/')) {
      throw new Error('repositoryFullName must be in format "owner/repo"');
    }
    return new TeamRepository(repositoryFullName, role, defaultBranch, profileId ?? null, addedBy, new Date());
  }

  static reconstitute(
    repositoryFullName: string,
    role: RepositoryRole,
    defaultBranch: string,
    profileId: string | null,
    addedBy: string,
    addedAt: Date,
  ): TeamRepository {
    return new TeamRepository(repositoryFullName, role, defaultBranch, profileId, addedBy, addedAt);
  }

  withRole(role: RepositoryRole): TeamRepository {
    return new TeamRepository(this.repositoryFullName, role, this.defaultBranch, this.profileId, this.addedBy, this.addedAt);
  }

  withDefaultBranch(branch: string): TeamRepository {
    return new TeamRepository(this.repositoryFullName, this.role, branch, this.profileId, this.addedBy, this.addedAt);
  }

  withProfileId(profileId: string): TeamRepository {
    return new TeamRepository(this.repositoryFullName, this.role, this.defaultBranch, profileId, this.addedBy, this.addedAt);
  }

  toObject() {
    return {
      repositoryFullName: this.repositoryFullName,
      role: this.role,
      defaultBranch: this.defaultBranch,
      profileId: this.profileId,
      addedBy: this.addedBy,
      addedAt: this.addedAt.toISOString(),
    };
  }
}
