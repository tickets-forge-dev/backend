import { JiraIntegration } from './JiraIntegration';

export const JIRA_INTEGRATION_REPOSITORY = Symbol('JIRA_INTEGRATION_REPOSITORY');

export interface JiraIntegrationRepository {
  findByUserAndWorkspace(userId: string, workspaceId: string): Promise<JiraIntegration | null>;
  save(integration: JiraIntegration): Promise<void>;
  deleteByUserAndWorkspace(userId: string, workspaceId: string): Promise<void>;
}
