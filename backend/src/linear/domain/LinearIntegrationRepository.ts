import { LinearIntegration } from './LinearIntegration';

export const LINEAR_INTEGRATION_REPOSITORY = Symbol('LINEAR_INTEGRATION_REPOSITORY');

export interface LinearIntegrationRepository {
  findByWorkspaceId(workspaceId: string): Promise<LinearIntegration | null>;
  save(integration: LinearIntegration): Promise<void>;
  deleteByWorkspaceId(workspaceId: string): Promise<void>;
}
