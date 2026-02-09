export interface LinearIntegrationProps {
  id: string;
  workspaceId: string;
  accessToken: string; // encrypted
  userName: string;
  teamId: string | null;
  teamName: string | null;
  connectedAt: Date;
  updatedAt: Date;
}

export class LinearIntegration {
  private constructor(private props: LinearIntegrationProps) {}

  static create(
    id: string,
    workspaceId: string,
    accessToken: string,
    userName: string,
  ): LinearIntegration {
    const now = new Date();
    return new LinearIntegration({
      id,
      workspaceId,
      accessToken,
      userName,
      teamId: null,
      teamName: null,
      connectedAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: LinearIntegrationProps): LinearIntegration {
    return new LinearIntegration(props);
  }

  updateAccessToken(encryptedToken: string): void {
    this.props.accessToken = encryptedToken;
    this.props.updatedAt = new Date();
  }

  setDefaultTeam(teamId: string, teamName: string): void {
    this.props.teamId = teamId;
    this.props.teamName = teamName;
    this.props.updatedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get workspaceId(): string { return this.props.workspaceId; }
  get accessToken(): string { return this.props.accessToken; }
  get userName(): string { return this.props.userName; }
  get teamId(): string | null { return this.props.teamId; }
  get teamName(): string | null { return this.props.teamName; }
  get connectedAt(): Date { return this.props.connectedAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toObject(): LinearIntegrationProps {
    return { ...this.props };
  }
}
