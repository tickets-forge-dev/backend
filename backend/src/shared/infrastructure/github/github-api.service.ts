/**
 * GitHub API Service
 *
 * Handles all GitHub API interactions:
 * - Repository information
 * - Branch listing and detection
 * - Commit information
 * - Default branch detection
 *
 * Infrastructure Layer - Uses Octokit (GitHub SDK)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

export interface GitHubRepository {
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  description: string | null;
}

export interface GitHubBranch {
  name: string;
  isDefault: boolean;
  commitSha: string;
  lastCommit: {
    sha: string;
    author: string | null;
    date: Date;
    message: string;
  };
}

@Injectable()
export class GitHubApiService {
  private readonly logger = new Logger(GitHubApiService.name);

  /**
   * Create an Octokit instance with the provided access token
   */
  private createOctokit(accessToken?: string): Octokit {
    return new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Get repository information including default branch
   */
  async getRepository(
    owner: string,
    repo: string,
    accessToken?: string,
  ): Promise<GitHubRepository> {
    try {
      this.logger.log(`Fetching repository: ${owner}/${repo}`);

      const octokit = this.createOctokit(accessToken);
      const { data } = await octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        fullName: data.full_name,
        defaultBranch: data.default_branch,
        isPrivate: data.private,
        description: data.description,
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch repository ${owner}/${repo}:`, error.message);

      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or not accessible`);
      }

      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  /**
   * Get default branch for a repository
   */
  async getDefaultBranch(owner: string, repo: string, accessToken?: string): Promise<string> {
    try {
      const repository = await this.getRepository(owner, repo, accessToken);
      return repository.defaultBranch;
    } catch (error: any) {
      this.logger.error(`Failed to get default branch for ${owner}/${repo}:`, error.message);

      // Fallback to common default branches
      return this.guessDefaultBranch(owner, repo, accessToken);
    }
  }

  /**
   * List all branches in a repository
   */
  async listBranches(owner: string, repo: string, accessToken?: string): Promise<GitHubBranch[]> {
    try {
      this.logger.log(`Listing branches for ${owner}/${repo}`);

      const octokit = this.createOctokit(accessToken);

      // Get default branch first
      const defaultBranch = await this.getDefaultBranch(owner, repo, accessToken);

      // Get all branches
      const { data: branches } = await octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100, // Get up to 100 branches
      });

      // Fetch commit details for each branch
      const branchesWithDetails = await Promise.all(
        branches.map(async (branch) => {
          try {
            const { data: commit } = await octokit.rest.repos.getCommit({
              owner,
              repo,
              ref: branch.commit.sha,
            });

            return {
              name: branch.name,
              isDefault: branch.name === defaultBranch,
              commitSha: branch.commit.sha,
              lastCommit: {
                sha: commit.sha,
                author: commit.commit.author?.name || null,
                date: new Date(commit.commit.author?.date || Date.now()),
                message: commit.commit.message,
              },
            };
          } catch (error) {
            // If commit fetch fails, return basic info
            return {
              name: branch.name,
              isDefault: branch.name === defaultBranch,
              commitSha: branch.commit.sha,
              lastCommit: {
                sha: branch.commit.sha,
                author: null,
                date: new Date(),
                message: '',
              },
            };
          }
        }),
      );

      // Sort: default branch first, then alphabetically
      return branchesWithDetails.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error: any) {
      this.logger.error(`Failed to list branches for ${owner}/${repo}:`, error.message);
      throw new Error(`Failed to list branches: ${error.message}`);
    }
  }

  /**
   * Get HEAD commit SHA for a specific branch
   */
  async getBranchHead(
    owner: string,
    repo: string,
    branch: string,
    accessToken?: string,
  ): Promise<string> {
    try {
      this.logger.log(`Getting HEAD commit for ${owner}/${repo}@${branch}`);

      const octokit = this.createOctokit(accessToken);
      const { data } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch,
      });

      return data.commit.sha;
    } catch (error: any) {
      this.logger.error(`Failed to get branch HEAD for ${owner}/${repo}@${branch}:`, error.message);

      if (error.status === 404) {
        throw new Error(`Branch "${branch}" not found in ${owner}/${repo}`);
      }

      throw new Error(`Failed to get branch HEAD: ${error.message}`);
    }
  }

  /**
   * Verify if a repository is accessible
   */
  async verifyRepositoryAccess(
    owner: string,
    repo: string,
    accessToken?: string,
  ): Promise<boolean> {
    try {
      await this.getRepository(owner, repo, accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify if a branch exists
   */
  async verifyBranchExists(
    owner: string,
    repo: string,
    branch: string,
    accessToken?: string,
  ): Promise<boolean> {
    try {
      await this.getBranchHead(owner, repo, branch, accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fallback: Guess default branch by trying common names
   */
  private async guessDefaultBranch(
    owner: string,
    repo: string,
    accessToken?: string,
  ): Promise<string> {
    const commonDefaults = ['main', 'master', 'develop', 'trunk'];

    this.logger.log(`Guessing default branch for ${owner}/${repo}`);

    for (const branch of commonDefaults) {
      const exists = await this.verifyBranchExists(owner, repo, branch, accessToken);
      if (exists) {
        this.logger.log(`Found branch "${branch}" - using as default`);
        return branch;
      }
    }

    // Last resort: return 'main' and let it fail later
    this.logger.warn(
      `Could not determine default branch for ${owner}/${repo}, defaulting to "main"`,
    );
    return 'main';
  }
}
