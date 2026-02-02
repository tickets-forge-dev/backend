/**
 * GitHubIntegrationRepository Interface (Port)
 * 
 * Defines the contract for persisting and retrieving GitHub integrations.
 * This is a PORT in Hexagonal Architecture.
 * Implementation will be in infrastructure layer (adapter).
 * 
 * Part of: Story 4.1 - GitHub App Integration
 * Layer: Domain (interface only, no implementation)
 */

import { GitHubIntegration } from './GitHubIntegration';

export const GITHUB_INTEGRATION_REPOSITORY = 'GITHUB_INTEGRATION_REPOSITORY';

export interface GitHubIntegrationRepository {
  /**
   * Find integration by workspace ID
   */
  findByWorkspaceId(workspaceId: string): Promise<GitHubIntegration | null>;

  /**
   * Find integration by ID
   */
  findById(id: string): Promise<GitHubIntegration | null>;

  /**
   * Save or update integration
   */
  save(integration: GitHubIntegration): Promise<void>;

  /**
   * Delete integration by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete integration by workspace ID (optimized - no collection group query)
   */
  deleteByWorkspaceId(workspaceId: string): Promise<void>;

  /**
   * Check if workspace has integration
   */
  existsByWorkspaceId(workspaceId: string): Promise<boolean>;
}
