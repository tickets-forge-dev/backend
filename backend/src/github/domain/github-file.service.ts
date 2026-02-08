/**
 * GitHubFileService Interface
 * Domain layer port for reading GitHub repository files
 *
 * This interface defines the contract for GitHub file access operations.
 * Implementations must handle authentication, caching, and error mapping.
 *
 * Part of: Story 9-1 - GitHub File Service
 * Layer: Domain (no external dependencies)
 */

/**
 * Represents a single entry (file or directory) in a repository tree
 * Maps to GitHub REST API tree entry structure
 */
export interface TreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/**
 * Value object representing complete repository file tree from GitHub API
 * Maps directly to GitHub REST API response structure for tree endpoint
 */
export interface FileTree {
  sha: string;
  url: string;
  tree: TreeEntry[];
  truncated: boolean;
}

/**
 * Main service interface for reading GitHub repository files
 * Must be implemented in infrastructure layer using GitHub REST API
 *
 * @example
 * ```typescript
 * // Get repository structure
 * const tree = await githubFileService.getTree('facebook', 'react');
 *
 * // Find TypeScript files
 * const tsFiles = await githubFileService.findByPattern(tree, 'src/**\/*.ts');
 *
 * // Read package.json
 * const content = await githubFileService.readFile('facebook', 'react', 'package.json');
 * ```
 */
export interface GitHubFileService {
  /**
   * Retrieve complete repository file tree structure
   *
   * @param owner - Repository owner username or organization
   * @param repo - Repository name
   * @param branch - Git branch name (defaults to 'main')
   * @returns FileTree with repository structure
   * @throws {GitHubAuthError} If authentication fails
   * @throws {GitHubRateLimitError} If rate limit exceeded
   * @throws {NetworkError} If network communication fails
   *
   * @example
   * ```typescript
   * const tree = await service.getTree('facebook', 'react', 'main');
   * console.log(`Found ${tree.tree.length} entries`);
   * ```
   */
  getTree(owner: string, repo: string, branch?: string): Promise<FileTree>;

  /**
   * Read file contents from repository
   *
   * @param owner - Repository owner username or organization
   * @param repo - Repository name
   * @param path - File path relative to repository root
   * @param branch - Git branch name (defaults to 'main')
   * @returns File contents as UTF-8 string (base64 decoded from GitHub API)
   * @throws {GitHubAuthError} If authentication fails
   * @throws {FileNotFoundError} If file does not exist
   * @throws {NetworkError} If network communication fails
   *
   * @example
   * ```typescript
   * const content = await service.readFile('facebook', 'react', 'package.json');
   * const pkg = JSON.parse(content);
   * ```
   */
  readFile(owner: string, repo: string, path: string, branch?: string): Promise<string>;

  /**
   * Find files in tree matching glob pattern
   *
   * Uses minimatch for pattern matching. Supports wildcards and glob syntax.
   *
   * @param tree - FileTree to search
   * @param pattern - Glob pattern (e.g., 'src/**\/*.ts', '*.json')
   * @returns Array of file paths matching pattern
   *
   * @example
   * ```typescript
   * const tree = await service.getTree('facebook', 'react');
   * const configs = await service.findByPattern(tree, '*.config.*');
   * const testFiles = await service.findByPattern(tree, '**\/__tests__/**\/*.ts');
   * ```
   */
  findByPattern(tree: FileTree, pattern: string): Promise<string[]>;

  /**
   * Smart file discovery by type with priority-based search
   *
   * Searches tree for specific file types in priority order:
   * - package.json: ['package.json']
   * - tsconfig: ['tsconfig.json', 'tsconfig.*.json']
   * - config: ['.eslintrc*', '.prettierrc*', '.babelrc*', 'jest.config.*', etc]
   *
   * @param tree - FileTree to search
   * @param type - File type to find
   * @returns File path if found, null otherwise
   *
   * @example
   * ```typescript
   * const tree = await service.getTree('facebook', 'react');
   * const pkgPath = await service.getFileByType(tree, 'package.json');
   * const tsconfigPath = await service.getFileByType(tree, 'tsconfig');
   * ```
   */
  getFileByType(
    tree: FileTree,
    type: 'package.json' | 'tsconfig' | 'config',
  ): Promise<string | null>;
}

/**
 * Base error class for GitHub-related errors
 * Provides typed error handling instead of stringly-typed errors
 */
export class GitHubError extends Error {
  /**
   * @param message - Human-readable error message
   * @param code - Machine-readable error code for error handling logic
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

/**
 * Error thrown when GitHub API rate limit is exceeded
 * Includes reset time for exponential backoff strategies
 */
export class GitHubRateLimitError extends GitHubError {
  /**
   * @param resetTime - Date when rate limit resets
   */
  constructor(public readonly resetTime: Date) {
    super('GitHub API rate limit exceeded', 'RATE_LIMIT');
    this.name = 'GitHubRateLimitError';
  }
}

/**
 * Error thrown when GitHub authentication fails
 * Typically indicates missing or invalid GitHub token
 */
export class GitHubAuthError extends GitHubError {
  constructor() {
    super('GitHub authentication failed', 'AUTH_FAILED');
    this.name = 'GitHubAuthError';
  }
}

/**
 * Error thrown when a requested file is not found
 * Typically a 404 from GitHub API
 */
export class FileNotFoundError extends GitHubError {
  /**
   * @param path - File path that was not found
   */
  constructor(path: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND');
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown for network-related failures
 * Includes connection errors, timeouts, and other transport issues
 */
export class NetworkError extends GitHubError {
  /**
   * @param message - Details about the network error
   */
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
