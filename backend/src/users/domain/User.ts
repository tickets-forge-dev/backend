import { TeamId } from '../../teams/domain/TeamId';

/**
 * User - Domain Entity
 *
 * Represents a user with multi-team support.
 * Users can belong to multiple teams and have a current active team.
 */
export class User {
  private readonly userId: string;
  private readonly email: string;
  private readonly displayName: string;
  private readonly photoURL?: string;
  private readonly currentTeamId: TeamId | null;
  private readonly teams: TeamId[];
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  private constructor(
    userId: string,
    email: string,
    displayName: string,
    photoURL: string | undefined,
    currentTeamId: TeamId | null,
    teams: TeamId[],
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.userId = userId;
    this.email = email;
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.currentTeamId = currentTeamId;
    this.teams = teams;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Factory methods
  static create(
    userId: string,
    email: string,
    displayName: string,
    photoURL?: string,
  ): User {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }

    return new User(
      userId.trim(),
      email.trim(),
      displayName.trim() || email.split('@')[0],
      photoURL,
      null, // No team initially
      [], // Empty teams array
      new Date(),
      new Date(),
    );
  }

  static reconstitute(
    userId: string,
    email: string,
    displayName: string,
    photoURL: string | undefined,
    currentTeamId: TeamId | null,
    teams: TeamId[],
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(
      userId,
      email,
      displayName,
      photoURL,
      currentTeamId,
      teams,
      createdAt,
      updatedAt,
    );
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getEmail(): string {
    return this.email;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  getPhotoURL(): string | undefined {
    return this.photoURL;
  }

  getCurrentTeamId(): TeamId | null {
    return this.currentTeamId;
  }

  getTeams(): TeamId[] {
    return [...this.teams]; // Return copy
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // Business logic methods
  hasTeams(): boolean {
    return this.teams.length > 0;
  }

  isMemberOfTeam(teamId: TeamId): boolean {
    return this.teams.some((t) => t.equals(teamId));
  }

  addTeam(teamId: TeamId): User {
    if (this.isMemberOfTeam(teamId)) {
      return this; // Already a member, no change
    }

    const updatedTeams = [...this.teams, teamId];
    const updatedCurrentTeamId = this.currentTeamId || teamId; // Set as current if no current team

    return new User(
      this.userId,
      this.email,
      this.displayName,
      this.photoURL,
      updatedCurrentTeamId,
      updatedTeams,
      this.createdAt,
      new Date(),
    );
  }

  removeTeam(teamId: TeamId): User {
    if (!this.isMemberOfTeam(teamId)) {
      return this; // Not a member, no change
    }

    const updatedTeams = this.teams.filter((t) => !t.equals(teamId));

    // If removing current team, switch to first available or null
    let updatedCurrentTeamId = this.currentTeamId;
    if (this.currentTeamId?.equals(teamId)) {
      updatedCurrentTeamId = updatedTeams.length > 0 ? updatedTeams[0] : null;
    }

    return new User(
      this.userId,
      this.email,
      this.displayName,
      this.photoURL,
      updatedCurrentTeamId,
      updatedTeams,
      this.createdAt,
      new Date(),
    );
  }

  switchTeam(teamId: TeamId): User {
    if (!this.isMemberOfTeam(teamId)) {
      throw new Error(
        `Cannot switch to team ${teamId.getValue()}: User is not a member`,
      );
    }

    if (this.currentTeamId?.equals(teamId)) {
      return this; // Already on this team, no change
    }

    return new User(
      this.userId,
      this.email,
      this.displayName,
      this.photoURL,
      teamId,
      this.teams,
      this.createdAt,
      new Date(),
    );
  }

  // Serialization
  toObject() {
    return {
      userId: this.userId,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      currentTeamId: this.currentTeamId?.getValue() || null,
      teams: this.teams.map((t) => t.getValue()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
