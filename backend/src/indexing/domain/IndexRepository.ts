/**
 * IndexRepository Port (Interface)
 * 
 * Defines persistence operations for Index aggregate.
 * Interface (port) - implemented in infrastructure layer.
 * 
 * Part of: Story 4.2 - Task 2 (Domain Models)
 * Layer: Domain
 */

import { Index } from './Index';

export interface IndexRepository {
  /**
   * Save or update an index
   */
  save(index: Index): Promise<void>;

  /**
   * Find index by ID
   */
  findById(indexId: string): Promise<Index | null>;

  /**
   * Find all indexes for a workspace and repository
   * Returns indexes ordered by createdAt desc (newest first)
   */
  findByWorkspaceAndRepo(
    workspaceId: string,
    repoId: number,
  ): Promise<Index[]>;

  /**
   * Find all indexes for a workspace
   * Returns indexes ordered by createdAt desc (newest first)
   */
  findByWorkspace(workspaceId: string): Promise<Index[]>;

  /**
   * Find latest index for a repository
   */
  findLatestByRepo(
    workspaceId: string,
    repoId: number,
  ): Promise<Index | null>;

  /**
   * Update index progress (for real-time tracking)
   * Optimized for frequent updates during indexing
   */
  updateProgress(
    indexId: string,
    filesIndexed: number,
    totalFiles: number,
  ): Promise<void>;

  /**
   * Delete an index
   */
  delete(indexId: string): Promise<void>;

  /**
   * Count indexes for a workspace (for quota enforcement)
   */
  countByWorkspace(workspaceId: string): Promise<number>;
}

/**
 * Dependency injection token
 */
export const INDEX_REPOSITORY = Symbol('INDEX_REPOSITORY');
