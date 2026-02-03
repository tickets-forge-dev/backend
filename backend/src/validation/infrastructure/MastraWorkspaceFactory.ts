import {
  Workspace,
  LocalSandbox,
  WORKSPACE_TOOLS,
} from '@mastra/core/workspace';
import path from 'path';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Factory for creating and managing Mastra workspaces for repository analysis
 *
 * MEMORY OPTIMIZATION (v2):
 * - NO LocalFilesystem: Prevents indexing entire repo into memory
 * - On-demand file access: Agents use shell commands (cat, grep, find) via LocalSandbox
 * - Skills loading: Lightweight, only loads skill definitions
 * 
 * This approach prevents OOM errors when working with large repositories
 * (especially those with node_modules/). Agents access files as needed
 * instead of pre-loading the entire directory structure.
 *
 * Each workspace provides:
 * - LocalSandbox: Safe command execution (cat, grep, find, npm, git)
 * - Skills: Reusable analysis patterns from backend/workspace/skills/
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

    // PERFORMANCE FIX: Don't use LocalFilesystem with large repos
    // Instead, create a minimal workspace that only uses tools
    // The agent will access files on-demand via tools, not by indexing
    const workspace = new Workspace({
      // NOTE: We're NOT providing filesystem here to avoid memory issues
      // The agent will use execute_command tool to read files on-demand
      sandbox: new LocalSandbox({
        workingDirectory: repoPath,
        // Minimal environment for security
        env: {
          NODE_ENV: 'analysis',
          PATH: process.env.PATH, // Keep PATH for npm, git, etc.
        },
      }),
      skills: ['./workspace/skills'], // Skills auto-discovered from backend/workspace/skills/
      tools: {
        // Global defaults
        enabled: true,
        requireApproval: false,

        // Allow safe read operations via sandbox commands
        // Agent can use: cat, find, grep, ls, etc.
        [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: { enabled: true },
      },
    });

    // Initialize workspace (loads skills only, no filesystem indexing)
    // This should be lightweight and fast
    try {
      this.logger.log(`⏳ Initializing workspace (skills only)...`);
      await workspace.init();
      this.logger.log(`✅ Workspace initialized successfully`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to initialize workspace: ${err.message}`);
      throw new Error(`Workspace initialization failed for ${cacheKey}: ${err.message}`);
    }

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

  /**
   * List available skills for agents
   *
   * Returns metadata for all skills in backend/workspace/skills/
   * Used by Quick Preflight Validator to discover and select skills
   *
   * @returns Array of skill metadata
   */
  async listAvailableSkills(): Promise<
    Array<{
      name: string;
      description: string;
      tags: string[];
      path: string;
    }>
  > {
    const fs = require('fs').promises;
    const skillsPath = path.join(process.cwd(), 'workspace', 'skills');

    try {
      const dirs = await fs.readdir(skillsPath);
      const skills = [];

      for (const dir of dirs) {
        // Skip README and hidden files
        if (dir.startsWith('.') || dir === 'README.md') {
          continue;
        }

        const skillPath = path.join(skillsPath, dir, 'SKILL.md');

        try {
          const content = await fs.readFile(skillPath, 'utf-8');

          // Parse frontmatter (YAML between --- markers)
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const nameMatch = frontmatter.match(/name:\s*(.+)/);
            const descMatch = frontmatter.match(/description:\s*(.+)/);
            const tagsMatch = frontmatter.match(/tags:\s*\[(.+)\]/);

            skills.push({
              name: nameMatch ? nameMatch[1].trim() : dir,
              description: descMatch ? descMatch[1].trim() : '',
              tags: tagsMatch
                ? tagsMatch[1].split(',').map((t: string) => t.trim())
                : [],
              path: `workspace/skills/${dir}/SKILL.md`,
            });
          }
        } catch (err) {
          const error = err as Error;
          this.logger.warn(`Failed to read skill: ${dir}`, error.message);
        }
      }

      this.logger.log(`📋 Found ${skills.length} skills`);
      return skills;
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to list skills', error);
      return [];
    }
  }
}
