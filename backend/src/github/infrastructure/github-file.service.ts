/**
 * GitHubFileServiceImpl - Infrastructure Layer Implementation
 * Implements GitHubFileService using @octokit/rest GitHub API client
 *
 * Responsibilities:
 * - GitHub API communication via @octokit/rest
 * - Response caching with configurable TTL
 * - Error mapping from GitHub API to domain errors
 * - Base64 decoding for file contents
 *
 * Part of: Story 9-1 - GitHub File Service
 * Layer: Infrastructure (external SDK integration)
 */

import { Injectable, Inject } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import {
  GitHubFileService,
  FileTree,
  TreeEntry,
  GitHubRateLimitError,
  GitHubAuthError,
  FileNotFoundError,
  NetworkError,
} from '../domain/github-file.service';

/**
 * Internal cache entry type with TTL tracking
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * GitHub API file service implementation
 * Provides cached access to GitHub repository files via REST API
 *
 * Caching Strategy:
 * - Tree endpoints: 1 hour TTL (structure changes infrequently)
 * - File contents: 24 hours TTL (content unlikely to change during analysis)
 * - Cache key: `${type}:${owner}:${repo}:${path}:${branch}`
 *
 * Error Handling:
 * - 401/EAUTH → GitHubAuthError (missing or invalid token)
 * - 403 rate limit → GitHubRateLimitError (with reset time)
 * - 404 → FileNotFoundError (file/repo not found)
 * - Connection errors → NetworkError (ECONNREFUSED, ETIMEDOUT, etc)
 */
@Injectable()
export class GitHubFileServiceImpl implements GitHubFileService {
  private octokit: Octokit;
  private cache = new Map<string, CacheEntry<any>>();

  private readonly TREE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly FILE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize service with GitHub token
   *
   * @param githubToken - GitHub authentication token (from environment or injection)
   * Note: Service can be initialized without token, but will fail on actual API calls
   */
  constructor(@Inject('GITHUB_TOKEN') private githubToken: string) {
    // Initialize octokit if token is available, otherwise will error on first API call
    if (githubToken) {
      this.octokit = new Octokit({ auth: githubToken });
    } else {
      // Create a dummy octokit that will fail on actual API calls
      this.octokit = null as any;
    }
  }

  /**
   * Retrieve complete repository file tree structure
   * Uses GitHub REST API endpoint: GET /repos/{owner}/{repo}/git/trees/{tree_sha}
   *
   * Implementation:
   * - Checks cache first (TREE_CACHE_TTL)
   * - Queries recursive tree with max 100,000 entries
   * - Returns truncated flag if results exceed limit
   * - Caches successful responses
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branch - Git branch name (defaults to 'main')
   * @returns FileTree with repository structure
   * @throws {GitHubAuthError} If authentication fails (401)
   * @throws {GitHubRateLimitError} If rate limit exceeded (403)
   * @throws {NetworkError} If network communication fails
   *
   * @example
   * ```typescript
   * const tree = await service.getTree('facebook', 'react');
   * console.log(`Repository has ${tree.tree.length} entries`);
   * if (tree.truncated) {
   *   console.warn('Repository too large, results truncated');
   * }
   * ```
   */
  async getTree(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<FileTree> {
    // Check if GitHub token is configured
    if (!this.githubToken) {
      throw new GitHubAuthError();
    }

    const cacheKey = `tree:${owner}:${repo}:${branch}`;

    // Check cache
    const cached = this.getFromCache<FileTree>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Query GitHub API with recursive=1 to get full tree
      const response = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: '1',
      });

      const fileTree: FileTree = {
        sha: response.data.sha,
        url: response.data.url,
        tree: response.data.tree as TreeEntry[],
        truncated: response.data.truncated || false,
      };

      // Store in cache
      this.setCache(cacheKey, fileTree, this.TREE_CACHE_TTL);
      return fileTree;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Read file contents from repository
   * Uses GitHub REST API endpoint: GET /repos/{owner}/{repo}/contents/{path}
   *
   * Implementation:
   * - Checks cache first (FILE_CACHE_TTL)
   * - Fetches file from specified branch
   * - Decodes base64 content from GitHub API
   * - Returns UTF-8 string
   * - Caches successful reads
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - File path relative to repository root
   * @param branch - Git branch name (defaults to 'main')
   * @returns File contents as UTF-8 string (base64 decoded)
   * @throws {GitHubAuthError} If authentication fails (401)
   * @throws {FileNotFoundError} If file does not exist (404)
   * @throws {NetworkError} If network communication fails
   *
   * @example
   * ```typescript
   * const content = await service.readFile('facebook', 'react', 'package.json');
   * const pkg = JSON.parse(content);
   * console.log(`Version: ${pkg.version}`);
   * ```
   */
  async readFile(
    owner: string,
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<string> {
    // Check if GitHub token is configured
    if (!this.githubToken) {
      throw new GitHubAuthError();
    }

    const cacheKey = `file:${owner}:${repo}:${path}:${branch}`;

    // Check cache
    const cached = this.getFromCache<string>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      // Reject directories (array response from API)
      if (Array.isArray(response.data)) {
        throw new Error('Path is a directory, not a file');
      }

      // Reject symlinks and other non-file types
      const data = response.data;
      if (data.type !== 'file' || !('content' in data)) {
        throw new Error(`Path is not a regular file (type: ${data.type})`);
      }

      // Decode base64 content from GitHub API
      // GitHub always returns content in base64 for binary safety
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      // Store in cache
      this.setCache(cacheKey, content, this.FILE_CACHE_TTL);
      return content;
    } catch (error) {
      this.handleError(error, path);
    }
  }

  /**
   * Find files in tree matching glob pattern
   * Uses minimatch library for glob pattern matching
   *
   * Supported patterns:
   * - `*.json` - all JSON files in root
   * - `src/**\/*.ts` - all TypeScript files in src directory
   * - `**\/__tests__/**\/*.test.ts` - test files anywhere
   * - `config/*.js` - JavaScript files in config directory
   *
   * @param tree - FileTree to search (usually from getTree())
   * @param pattern - Glob pattern for matching
   * @returns Array of file paths matching pattern
   *
   * @example
   * ```typescript
   * const tree = await service.getTree('facebook', 'react');
   *
   * // Find all TypeScript files
   * const tsFiles = await service.findByPattern(tree, 'src/**\/*.ts');
   *
   * // Find config files
   * const configs = await service.findByPattern(tree, '*.config.*');
   *
   * // Find test files
   * const tests = await service.findByPattern(tree, '**\/*.test.ts');
   * ```
   */
  async findByPattern(tree: FileTree, pattern: string): Promise<string[]> {
    const { minimatch } = await import('minimatch');
    const matches: string[] = [];

    for (const entry of tree.tree) {
      // Only match files (blobs), not directories (trees)
      if (entry.type === 'blob' && minimatch(entry.path, pattern)) {
        matches.push(entry.path);
      }
    }

    return matches;
  }

  /**
   * Smart file discovery by type with priority-based search
   * Searches tree for specific file types in order
   *
   * Priority lists:
   * - 'package.json': ['package.json']
   * - 'tsconfig': ['tsconfig.json', 'tsconfig.*.json']
   * - 'config': ['.eslintrc*', '.prettierrc*', '.babelrc*', 'jest.config.*', etc]
   *
   * @param tree - FileTree to search
   * @param type - File type to find
   * @returns File path if found, null if no matching file
   *
   * @example
   * ```typescript
   * const tree = await service.getTree('facebook', 'react');
   *
   * // Find package.json
   * const pkgPath = await service.getFileByType(tree, 'package.json');
   * if (pkgPath) {
   *   const content = await service.readFile('facebook', 'react', pkgPath);
   * }
   *
   * // Find TypeScript config
   * const tsconfigPath = await service.getFileByType(tree, 'tsconfig');
   * if (!tsconfigPath) {
   *   console.warn('No TypeScript config found');
   * }
   * ```
   */
  async getFileByType(
    tree: FileTree,
    type: 'package.json' | 'tsconfig' | 'config'
  ): Promise<string | null> {
    const patterns: Record<string, string[]> = {
      'package.json': ['package.json'],
      tsconfig: ['tsconfig.json', 'tsconfig.*.json'],
      config: [
        '.eslintrc*',
        '.prettierrc*',
        '.babelrc*',
        'jest.config.*',
        'webpack.config.*',
        'vite.config.*',
        'rollup.config.*',
        'esbuild.config.*',
        '.editorconfig',
        '.npmrc',
        '.nvmrc',
      ],
    };

    const typePatterns = patterns[type] || [];

    // Lazy load minimatch only when needed
    const { minimatch } = await import('minimatch');

    for (const pattern of typePatterns) {
      for (const entry of tree.tree) {
        if (entry.type === 'blob' && minimatch(entry.path, pattern)) {
          return entry.path;
        }
      }
    }

    return null;
  }

  /**
   * Retrieve value from cache if not expired
   *
   * @param key - Cache key
   * @returns Cached value or null if expired/not found
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store value in cache with TTL
   *
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Map GitHub API errors to domain error types
   * Handles authentication, rate limiting, not found, and network errors
   *
   * Error Mapping:
   * - 401 or EAUTH → GitHubAuthError
   * - 403 rate limit → GitHubRateLimitError (with reset time)
   * - 404 → FileNotFoundError
   * - ECONNREFUSED, ETIMEDOUT → NetworkError
   * - Others → NetworkError (wrapped)
   *
   * @param error - Original GitHub API error
   * @param filePath - Optional file path for FileNotFoundError
   * @throws Mapped domain error
   */
  private handleError(error: any, filePath?: string): never {
    // Authentication errors
    if (error.status === 401 || error.code === 'EAUTH') {
      throw new GitHubAuthError();
    }

    // Rate limit errors (HTTP 403 with specific message)
    if (error.status === 403 && error.message?.includes('API rate limit')) {
      const resetTime = error.response?.headers['x-ratelimit-reset'];
      throw new GitHubRateLimitError(new Date(parseInt(resetTime) * 1000));
    }

    // File/repo not found
    if (error.status === 404) {
      throw new FileNotFoundError(filePath || 'unknown');
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new NetworkError(`Network error: ${error.message}`);
    }

    // Unknown errors wrapped as NetworkError
    throw new NetworkError(error.message || 'Unknown GitHub API error');
  }

  /**
   * Clear all cached data
   * Useful for testing and manual cache invalidation
   *
   * @example
   * ```typescript
   * service.clearCache();
   * ```
   */
  clearCache(): void {
    this.cache.clear();
  }
}
