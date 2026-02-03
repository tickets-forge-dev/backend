/**
 * GitHub Validation Service
 *
 * Provides fast validation using GitHub API without cloning repositories.
 * Used as primary validation method in QuickPreflightValidator.
 *
 * Capabilities:
 * - Fetch file content from GitHub
 * - Check file existence
 * - Parse JSON files (package.json, tsconfig.json)
 * - Search code patterns using GitHub Code Search API
 *
 * Layer: Infrastructure (GitHub Integration)
 */

import { Injectable, Logger } from '@nestjs/common';
import { GitHubApiService } from '../../shared/infrastructure/github/github-api.service';

export interface FileCheckResult {
  exists: boolean;
  content?: string;
  path: string;
}

export interface DependencyCheckResult {
  packageName: string;
  version?: string;
  exists: boolean;
  devDependency: boolean;
}

export interface CodeSearchResult {
  filePath: string;
  lineNumber: number;
  content: string;
}

@Injectable()
export class GitHubValidationService {
  private readonly logger = new Logger(GitHubValidationService.name);

  constructor(private readonly githubApi: GitHubApiService) {}

  /**
   * Check if a file exists in the repository
   */
  async fileExists(
    owner: string,
    repo: string,
    path: string,
    accessToken?: string,
  ): Promise<boolean> {
    try {
      this.logger.debug(`Checking if file exists: ${path}`);
      const content = await this.getFileContent(owner, repo, path, accessToken);
      return content !== null;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file content from GitHub
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    accessToken?: string,
  ): Promise<string | null> {
    try {
      this.logger.debug(`Fetching file content: ${path}`);

      const octokit = (this.githubApi as any).createOctokit(accessToken);
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      // Handle file content (not directory)
      if ('content' in data && data.type === 'file') {
        // Content is base64 encoded
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        this.logger.debug(`✅ File found: ${path} (${content.length} bytes)`);
        return content;
      }

      this.logger.warn(`Path is not a file: ${path}`);
      return null;
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.debug(`❌ File not found: ${path}`);
        return null;
      }

      const err = error as Error;
      this.logger.error(
        `Failed to fetch file ${path}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Parse package.json and check if dependency exists
   */
  async checkDependency(
    owner: string,
    repo: string,
    packageName: string,
    accessToken?: string,
  ): Promise<DependencyCheckResult> {
    try {
      this.logger.debug(`Checking dependency: ${packageName}`);

      const packageJsonContent = await this.getFileContent(
        owner,
        repo,
        'package.json',
        accessToken,
      );

      if (!packageJsonContent) {
        return {
          packageName,
          exists: false,
          devDependency: false,
        };
      }

      const packageJson = JSON.parse(packageJsonContent);
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};

      if (deps[packageName]) {
        return {
          packageName,
          version: deps[packageName],
          exists: true,
          devDependency: false,
        };
      }

      if (devDeps[packageName]) {
        return {
          packageName,
          version: devDeps[packageName],
          exists: true,
          devDependency: true,
        };
      }

      return {
        packageName,
        exists: false,
        devDependency: false,
      };
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(
        `Failed to check dependency ${packageName}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Search code patterns using GitHub Code Search API
   *
   * Example queries:
   * - 'useQuery path:client/src language:typescript'
   * - 'app.use path:src/main.ts'
   * - 'import helmet'
   */
  async searchCode(
    owner: string,
    repo: string,
    query: string,
    accessToken?: string,
  ): Promise<CodeSearchResult[]> {
    try {
      this.logger.debug(`Searching code: ${query}`);

      const octokit = (this.githubApi as any).createOctokit(accessToken);

      // Add repo qualifier to query
      const fullQuery = `${query} repo:${owner}/${repo}`;

      const { data } = await octokit.rest.search.code({
        q: fullQuery,
        per_page: 10, // Limit results for performance
      });

      const results: CodeSearchResult[] = [];

      for (const item of data.items) {
        // Fetch the actual file to get line numbers
        const content = await this.getFileContent(
          owner,
          repo,
          item.path,
          accessToken,
        );

        if (content) {
          // Find line numbers where pattern matches
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes(query.split(' ')[0])) {
              // Simple match
              results.push({
                filePath: item.path,
                lineNumber: index + 1,
                content: line.trim(),
              });
            }
          });
        }
      }

      this.logger.debug(`✅ Found ${results.length} matches`);
      return results;
    } catch (error: any) {
      // Handle rate limiting
      if (error.status === 403) {
        this.logger.warn(
          `GitHub API rate limit hit for code search: ${query}`,
        );
        return [];
      }

      const err = error as Error;
      this.logger.error(`Failed to search code: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Parse multiple JSON files at once
   */
  async getJsonFiles(
    owner: string,
    repo: string,
    paths: string[],
    accessToken?: string,
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    await Promise.all(
      paths.map(async (path) => {
        try {
          const content = await this.getFileContent(
            owner,
            repo,
            path,
            accessToken,
          );
          if (content) {
            results[path] = JSON.parse(content);
          }
        } catch (error: any) {
          const err = error as Error;
          this.logger.warn(
            `Failed to parse JSON file ${path}: ${err.message}`,
          );
        }
      }),
    );

    return results;
  }
}
