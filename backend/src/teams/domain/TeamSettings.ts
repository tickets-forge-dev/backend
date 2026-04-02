/**
 * TeamSettings - Value Object
 *
 * Immutable settings for a team.
 * Includes workspace defaults and permission settings.
 */
import { TeamRepository } from './TeamRepository';

export class TeamSettings {
  readonly defaultWorkspaceId?: string;
  readonly allowMemberInvites: boolean;
  readonly repositories: TeamRepository[];

  private constructor(
    defaultWorkspaceId: string | undefined,
    allowMemberInvites: boolean,
    repositories: TeamRepository[] = [],
  ) {
    this.defaultWorkspaceId = defaultWorkspaceId;
    this.allowMemberInvites = allowMemberInvites;
    this.repositories = repositories;
  }

  static create(
    defaultWorkspaceId?: string,
    allowMemberInvites: boolean = true,
    repositories: TeamRepository[] = [],
  ): TeamSettings {
    return new TeamSettings(defaultWorkspaceId, allowMemberInvites, repositories);
  }

  static default(): TeamSettings {
    return new TeamSettings(undefined, true, []);
  }

  withDefaultWorkspace(workspaceId: string): TeamSettings {
    return new TeamSettings(workspaceId, this.allowMemberInvites, this.repositories);
  }

  withMemberInvites(allowed: boolean): TeamSettings {
    return new TeamSettings(this.defaultWorkspaceId, allowed, this.repositories);
  }

  withRepositories(repositories: TeamRepository[]): TeamSettings {
    return new TeamSettings(this.defaultWorkspaceId, this.allowMemberInvites, repositories);
  }

  toObject() {
    return {
      defaultWorkspaceId: this.defaultWorkspaceId,
      allowMemberInvites: this.allowMemberInvites,
      repositories: this.repositories.map((r) => r.toObject()),
    };
  }
}
