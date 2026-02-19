/**
 * TeamSettings - Value Object
 *
 * Immutable settings for a team.
 * Includes workspace defaults and permission settings.
 */
export class TeamSettings {
  readonly defaultWorkspaceId?: string;
  readonly allowMemberInvites: boolean;

  private constructor(
    defaultWorkspaceId: string | undefined,
    allowMemberInvites: boolean,
  ) {
    this.defaultWorkspaceId = defaultWorkspaceId;
    this.allowMemberInvites = allowMemberInvites;
  }

  static create(
    defaultWorkspaceId?: string,
    allowMemberInvites: boolean = true,
  ): TeamSettings {
    return new TeamSettings(defaultWorkspaceId, allowMemberInvites);
  }

  static default(): TeamSettings {
    return new TeamSettings(undefined, true);
  }

  withDefaultWorkspace(workspaceId: string): TeamSettings {
    return new TeamSettings(workspaceId, this.allowMemberInvites);
  }

  withMemberInvites(allowed: boolean): TeamSettings {
    return new TeamSettings(this.defaultWorkspaceId, allowed);
  }

  toObject() {
    return {
      defaultWorkspaceId: this.defaultWorkspaceId,
      allowMemberInvites: this.allowMemberInvites,
    };
  }
}
