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
   * Delete integration
   */
  delete(id: string): Promise<void>;

  /**
   * Check if workspace has integration
   */
  existsByWorkspaceId(workspaceId: string): Promise<boolean>;
}
