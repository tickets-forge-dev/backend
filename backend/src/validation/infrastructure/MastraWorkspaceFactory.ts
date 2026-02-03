import {
  Workspace,
  LocalFilesystem,
  LocalSandbox,
  WORKSPACE_TOOLS,
} from '@mastra/core/workspace';
import path from 'path';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Factory for creating and managing Mastra workspaces for repository analysis
 *
 * Each workspace provides:
 * - LocalFilesystem: Read-only access to cloned repository
 * - LocalSandbox: Safe command execution (npm, grep, find, git)
 * - Skills: Reusable analysis patterns
 *
 * Workspaces are cached per repository for performance.
 */
@Injectable()
export class MastraWorkspaceFactory {
  private readonly logger = new Logger(MastraWorkspaceFactory.name);
  private static workspaces = new Map<string, Workspace>();

  /**
   * Get or create workspace for a repository
   *
   * @param workspaceId - User's workspace ID
   * @param repoName - Repository name (e.g., "user/repo")
   * @param indexId - Repository index ID from Epic 4
   * @returns Configured Mastra workspace
   */
  async getWorkspace(
    workspaceId: string,
    repoName: string,
    indexId: string,
  ): Promise<Workspace> {
    const cacheKey = `${workspaceId}-${repoName}`;

    // Return cached workspace if exists
    if (MastraWorkspaceFactory.workspaces.has(cacheKey)) {
      this.logger.log(`♻️ Reusing cached workspace for ${cacheKey}`);
      return MastraWorkspaceFactory.workspaces.get(cacheKey)!;
    }

    this.logger.log(`🔨 Creating new workspace for ${cacheKey}`);

    // Determine repository path
    const repoPath = this.getRepoPath(workspaceId, repoName);

    // Create workspace with safety configurations
    const workspace = new Workspace({
      filesystem: new LocalFilesystem({
        basePath: repoPath,
        readOnly: true, // CRITICAL: Prevent agents from modifying code
      }),
      sandbox: new LocalSandbox({
        workingDirectory: repoPath,
        // Minimal environment for security
        env: {
          NODE_ENV: 'analysis',
          PATH: process.env.PATH, // Keep PATH for npm, git, etc.
        },
      }),
      skills: ['/workspace/skills'], // Path relative to backend/
      tools: {
        // Global defaults
        enabled: true,
        requireApproval: false,

        // Disable destructive operations
        [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
          enabled: false,
        },

        // Allow safe read operations
        [WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: { enabled: true },
        [WORKSPACE_TOOLS.FILESYSTEM.LIST_FILES]: { enabled: true },

        // Allow safe command execution
        [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: { enabled: true },
      },
    });

    // Initialize workspace (creates directories, indexes skills)
    await workspace.init();

    // Cache for reuse
    MastraWorkspaceFactory.workspaces.set(cacheKey, workspace);

    this.logger.log(`✅ Workspace created and cached for ${cacheKey}`);

    return workspace;
  }

  /**
   * Get repository path for workspace
   *
   * Convention: workspace/cloned-repos/{workspaceId}-{repoName}
   */
  private getRepoPath(workspaceId: string, repoName: string): string {
    // Sanitize repo name (replace slashes with dashes)
    const sanitizedRepoName = repoName.replace(/\//g, '-');

    return path.join(
      process.cwd(),
      'workspace',
      'cloned-repos',
      `${workspaceId}-${sanitizedRepoName}`,
    );
  }

  /**
   * Clear workspace cache for a specific repository
   *
   * Call this when:
   * - Repository is updated (git pull)
   * - Repository is deleted
   * - Index is refreshed
   */
  clearWorkspace(workspaceId: string, repoName: string): void {
    const cacheKey = `${workspaceId}-${repoName}`;

    if (MastraWorkspaceFactory.workspaces.has(cacheKey)) {
      this.logger.log(`🗑️ Clearing workspace cache for ${cacheKey}`);
      MastraWorkspaceFactory.workspaces.delete(cacheKey);
    }
  }

  /**
   * Clear all workspace caches
   *
   * Call this on:
   * - Application shutdown
   * - Memory pressure
   * - Testing cleanup
   */
  clearAll(): void {
    const count = MastraWorkspaceFactory.workspaces.size;
    this.logger.log(`🗑️ Clearing all ${count} workspace caches`);
    MastraWorkspaceFactory.workspaces.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    workspaces: string[];
  } {
    return {
      size: MastraWorkspaceFactory.workspaces.size,
      workspaces: Array.from(MastraWorkspaceFactory.workspaces.keys()),
    };
  }

  /**
   * Check if workspace exists for repository
   */
  hasWorkspace(workspaceId: string, repoName: string): boolean {
    const cacheKey = `${workspaceId}-${repoName}`;
    return MastraWorkspaceFactory.workspaces.has(cacheKey);
  }
}
