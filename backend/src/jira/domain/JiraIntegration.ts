export interface JiraIntegrationProps {
  id: string;
  workspaceId: string;
  userId: string;
  jiraUrl: string; // e.g. https://mycompany.atlassian.net
  username: string; // Jira email
  apiToken: string; // encrypted
  connectedAt: Date;
  updatedAt: Date;
}

export class JiraIntegration {
  private constructor(private props: JiraIntegrationProps) {}

  static create(
    id: string,
    workspaceId: string,
    userId: string,
    jiraUrl: string,
    username: string,
    encryptedApiToken: string,
  ): JiraIntegration {
    const now = new Date();
    return new JiraIntegration({
      id,
      workspaceId,
      userId,
      jiraUrl: jiraUrl.replace(/\/+$/, ''), // strip trailing slashes
      username,
      apiToken: encryptedApiToken,
      connectedAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: JiraIntegrationProps): JiraIntegration {
    return new JiraIntegration(props);
  }

  updateCredentials(jiraUrl: string, username: string, encryptedApiToken: string): void {
    this.props.jiraUrl = jiraUrl.replace(/\/+$/, '');
    this.props.username = username;
    this.props.apiToken = encryptedApiToken;
    this.props.updatedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get workspaceId(): string { return this.props.workspaceId; }
  get userId(): string { return this.props.userId; }
  get jiraUrl(): string { return this.props.jiraUrl; }
  get username(): string { return this.props.username; }
  get apiToken(): string { return this.props.apiToken; }
  get connectedAt(): Date { return this.props.connectedAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toObject(): JiraIntegrationProps {
    return { ...this.props };
  }
}
