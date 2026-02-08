/**
 * GitHubFileServiceImpl Unit Tests
 * Part of: Story 9-1 - GitHub File Service
 * Coverage: 100% of public methods with mocked GitHub API
 */

import { GitHubFileServiceImpl } from '../github-file.service';
import {
  GitHubRateLimitError,
  GitHubAuthError,
  FileNotFoundError,
  NetworkError,
} from '../../domain/github-file.service';

// Mock Octokit before imports
let mockOctokit: any;

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => mockOctokit),
}));

describe('GitHubFileServiceImpl', () => {
  let service: GitHubFileServiceImpl;

  beforeEach(() => {
    // Reset mock for each test
    mockOctokit = {
      git: {
        getTree: jest.fn(),
      },
      repos: {
        getContent: jest.fn(),
      },
    };

    // Create service with mocked token
    service = new GitHubFileServiceImpl('mock-github-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
  });

  describe('constructor', () => {
    it('should throw GitHubAuthError when token is not provided', () => {
      expect(() => {
        new GitHubFileServiceImpl('');
      }).toThrow(GitHubAuthError);
    });

    it('should throw GitHubAuthError when token is null', () => {
      expect(() => {
        new GitHubFileServiceImpl(null as any);
      }).toThrow(GitHubAuthError);
    });

    it('should initialize successfully with valid token', () => {
      // Should not throw
      const testService = new GitHubFileServiceImpl('test-token-123');
      expect(testService).toBeDefined();
    });
  });

  describe('getTree', () => {
    it('should return FileTree with repository structure', async () => {
      const mockTree = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/abc123',
        tree: [
          {
            path: 'package.json',
            type: 'blob',
            mode: '100644',
            sha: 'def456',
            url: 'https://api.github.com/repos/owner/repo/git/blobs/def456',
          },
          {
            path: 'src',
            type: 'tree',
            mode: '040000',
            sha: 'ghi789',
            url: 'https://api.github.com/repos/owner/repo/git/trees/ghi789',
          },
          {
            path: 'src/index.ts',
            type: 'blob',
            mode: '100644',
            sha: 'jkl012',
            size: 1024,
            url: 'https://api.github.com/repos/owner/repo/git/blobs/jkl012',
          },
        ],
        truncated: false,
      };

      mockOctokit.git.getTree.mockResolvedValue({ data: mockTree });

      const result = await service.getTree('owner', 'repo');

      expect(result).toEqual(mockTree);
      expect(mockOctokit.git.getTree).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        tree_sha: 'main',
        recursive: '1',
      });
    });

    it('should use custom branch when provided', async () => {
      mockOctokit.git.getTree.mockResolvedValue({
        data: {
          sha: 'abc123',
          url: '',
          tree: [],
          truncated: false,
        },
      });

      await service.getTree('owner', 'repo', 'develop');

      expect(mockOctokit.git.getTree).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        tree_sha: 'develop',
        recursive: '1',
      });
    });

    it('should cache tree results and not call API on second request', async () => {
      const mockTree = {
        sha: 'abc123',
        url: '',
        tree: [],
        truncated: false,
      };

      mockOctokit.git.getTree.mockResolvedValue({ data: mockTree });

      // First call
      const result1 = await service.getTree('owner', 'repo');
      expect(mockOctokit.git.getTree).toHaveBeenCalledTimes(1);

      // Second call (should use cache)
      const result2 = await service.getTree('owner', 'repo');
      expect(mockOctokit.git.getTree).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(result1).toEqual(result2);
    });

    it('should use different cache keys for different branches', async () => {
      mockOctokit.git.getTree.mockResolvedValue({
        data: { sha: 'abc', url: '', tree: [], truncated: false },
      });

      await service.getTree('owner', 'repo', 'main');
      expect(mockOctokit.git.getTree).toHaveBeenCalledTimes(1);

      await service.getTree('owner', 'repo', 'develop');
      expect(mockOctokit.git.getTree).toHaveBeenCalledTimes(2); // Called again for different branch
    });

    it('should return truncated flag', async () => {
      mockOctokit.git.getTree.mockResolvedValue({
        data: {
          sha: 'abc123',
          url: '',
          tree: Array(100000).fill({ path: 'file.ts', type: 'blob', sha: '1' }),
          truncated: true,
        },
      });

      const result = await service.getTree('owner', 'repo');
      expect(result.truncated).toBe(true);
    });

    it('should throw GitHubAuthError on 401', async () => {
      mockOctokit.git.getTree.mockRejectedValue({
        status: 401,
        code: 'EAUTH',
      });

      await expect(service.getTree('owner', 'repo')).rejects.toThrow(GitHubAuthError);
    });

    it('should throw GitHubRateLimitError on 403 rate limit', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      mockOctokit.git.getTree.mockRejectedValue({
        status: 403,
        message: 'API rate limit exceeded for user ID 123',
        response: { headers: { 'x-ratelimit-reset': futureTime.toString() } },
      });

      const error = await service.getTree('owner', 'repo').catch((e) => e);
      expect(error).toBeInstanceOf(GitHubRateLimitError);
      expect(error.resetTime).toEqual(new Date(futureTime * 1000));
    });

    it('should throw NetworkError on connection refused', async () => {
      mockOctokit.git.getTree.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      await expect(service.getTree('owner', 'repo')).rejects.toThrow(NetworkError);
    });

    it('should throw NetworkError on timeout', async () => {
      mockOctokit.git.getTree.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      });

      await expect(service.getTree('owner', 'repo')).rejects.toThrow(NetworkError);
    });
  });

  describe('readFile', () => {
    it('should read and decode file contents', async () => {
      const content = 'console.log("hello world");';
      const encodedContent = Buffer.from(content).toString('base64');

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: encodedContent,
          type: 'file',
          path: 'src/index.js',
          sha: 'abc123',
        },
      });

      const result = await service.readFile('owner', 'repo', 'src/index.js');

      expect(result).toBe(content);
      expect(mockOctokit.repos.getContent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        path: 'src/index.js',
        ref: 'main',
      });
    });

    it('should decode JSON file correctly', async () => {
      const pkg = { name: 'test', version: '1.0.0' };
      const content = JSON.stringify(pkg);
      const encodedContent = Buffer.from(content).toString('base64');

      mockOctokit.repos.getContent.mockResolvedValue({
        data: { content: encodedContent, type: 'file' },
      });

      const result = await service.readFile('owner', 'repo', 'package.json');
      expect(JSON.parse(result)).toEqual(pkg);
    });

    it('should use custom branch when provided', async () => {
      mockOctokit.repos.getContent.mockResolvedValue({
        data: { content: Buffer.from('test').toString('base64'), type: 'file' },
      });

      await service.readFile('owner', 'repo', 'file.txt', 'develop');

      expect(mockOctokit.repos.getContent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        path: 'file.txt',
        ref: 'develop',
      });
    });

    it('should cache file contents and not call API on second request', async () => {
      const content = 'const x = 1;';
      const encodedContent = Buffer.from(content).toString('base64');

      mockOctokit.repos.getContent.mockResolvedValue({
        data: { content: encodedContent, type: 'file' },
      });

      // First call
      const result1 = await service.readFile('owner', 'repo', 'file.ts');
      expect(mockOctokit.repos.getContent).toHaveBeenCalledTimes(1);

      // Second call (should use cache)
      const result2 = await service.readFile('owner', 'repo', 'file.ts');
      expect(mockOctokit.repos.getContent).toHaveBeenCalledTimes(1); // Still 1

      expect(result1).toBe(result2);
    });

    it('should throw FileNotFoundError on 404', async () => {
      mockOctokit.repos.getContent.mockRejectedValue({ status: 404 });

      await expect(service.readFile('owner', 'repo', 'nonexistent.js')).rejects.toThrow(
        FileNotFoundError,
      );
    });

    it('should throw error when path is a directory', async () => {
      mockOctokit.repos.getContent.mockResolvedValue({
        data: [
          { name: 'file1.ts', type: 'file' },
          { name: 'file2.ts', type: 'file' },
        ],
      });

      await expect(service.readFile('owner', 'repo', 'src')).rejects.toThrow();
    });

    it('should throw GitHubAuthError on 401', async () => {
      mockOctokit.repos.getContent.mockRejectedValue({ status: 401 });

      await expect(service.readFile('owner', 'repo', 'file.ts')).rejects.toThrow(GitHubAuthError);
    });

    it('should throw NetworkError on connection refused', async () => {
      mockOctokit.repos.getContent.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      await expect(service.readFile('owner', 'repo', 'file.ts')).rejects.toThrow(NetworkError);
    });
  });

  describe('findByPattern', () => {
    it('should find files matching glob pattern src/**/*.ts', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'src/index.ts', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: 'src/service.ts', type: 'blob', mode: '100644', sha: '2', url: '' },
          { path: 'src/types.d.ts', type: 'blob', mode: '100644', sha: '3', url: '' },
          { path: 'src/index.js', type: 'blob', mode: '100644', sha: '4', url: '' },
          { path: 'tests/test.ts', type: 'blob', mode: '100644', sha: '5', url: '' },
        ],
        truncated: false,
      };

      const result = await service.findByPattern(tree, 'src/**/*.ts');

      expect(result).toContain('src/index.ts');
      expect(result).toContain('src/service.ts');
      expect(result).toContain('src/types.d.ts');
      expect(result).not.toContain('src/index.js');
      expect(result).not.toContain('tests/test.ts');
    });

    it('should find files matching glob pattern *.json', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'package.json', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: 'tsconfig.json', type: 'blob', mode: '100644', sha: '2', url: '' },
          { path: '.prettierrc.json', type: 'blob', mode: '100644', sha: '3', url: '' },
          { path: 'src/config.json', type: 'blob', mode: '100644', sha: '4', url: '' },
        ],
        truncated: false,
      };

      const result = await service.findByPattern(tree, '*.json');

      expect(result).toContain('package.json');
      expect(result).toContain('tsconfig.json');
      expect(result).not.toContain('.prettierrc.json'); // Hidden file doesn't match *.json
      expect(result).not.toContain('src/config.json'); // Nested file
    });

    it('should find test files with pattern **/*.test.ts', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'src/index.test.ts', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: 'tests/unit.test.ts', type: 'blob', mode: '100644', sha: '2', url: '' },
          { path: 'tests/integration.spec.ts', type: 'blob', mode: '100644', sha: '3', url: '' },
          { path: 'src/service.ts', type: 'blob', mode: '100644', sha: '4', url: '' },
        ],
        truncated: false,
      };

      const result = await service.findByPattern(tree, '**/*.test.ts');

      expect(result).toContain('src/index.test.ts');
      expect(result).toContain('tests/unit.test.ts');
      expect(result).not.toContain('tests/integration.spec.ts');
      expect(result).not.toContain('src/service.ts');
    });

    it('should only match files, not directories', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'src/index.ts', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: 'src', type: 'tree', mode: '040000', sha: '2', url: '' },
          { path: 'tests/test.ts', type: 'blob', mode: '100644', sha: '3', url: '' },
          { path: 'tests', type: 'tree', mode: '040000', sha: '4', url: '' },
        ],
        truncated: false,
      };

      const result = await service.findByPattern(tree, '**/*.ts');

      expect(result).toContain('src/index.ts');
      expect(result).toContain('tests/test.ts');
      expect(result).not.toContain('src');
      expect(result).not.toContain('tests');
    });

    it('should return empty array when no matches found', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'index.html', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: 'style.css', type: 'blob', mode: '100644', sha: '2', url: '' },
        ],
        truncated: false,
      };

      const result = await service.findByPattern(tree, '**/*.ts');

      expect(result).toEqual([]);
    });

    it('should handle complex patterns with multiple wildcards', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: '.config/app.config.ts', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: '.config/db.config.ts', type: 'blob', mode: '100644', sha: '2', url: '' },
          { path: 'src/config.ts', type: 'blob', mode: '100644', sha: '3', url: '' },
          { path: '.env', type: 'blob', mode: '100644', sha: '4', url: '' },
        ],
        truncated: false,
      };

      const result = await service.findByPattern(tree, '.config/*.config.ts');

      expect(result).toContain('.config/app.config.ts');
      expect(result).toContain('.config/db.config.ts');
      expect(result).not.toContain('src/config.ts');
    });
  });

  describe('getFileByType', () => {
    it('should find package.json in root', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'package.json', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: 'tsconfig.json', type: 'blob', mode: '100644', sha: '2', url: '' },
        ],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'package.json');
      expect(result).toBe('package.json');
    });

    it('should find tsconfig.json', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [{ path: 'tsconfig.json', type: 'blob', mode: '100644', sha: '1', url: '' }],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'tsconfig');
      expect(result).toBe('tsconfig.json');
    });

    it('should find extended tsconfig files like tsconfig.app.json', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'tsconfig.app.json', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: 'tsconfig.spec.json', type: 'blob', mode: '100644', sha: '2', url: '' },
        ],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'tsconfig');
      // Should find first match
      expect(['tsconfig.app.json', 'tsconfig.spec.json']).toContain(result);
    });

    it('should find config files by priority', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: '.eslintrc.json', type: 'blob', mode: '100644', sha: '1', url: '' },
          { path: '.prettierrc.json', type: 'blob', mode: '100644', sha: '2', url: '' },
          { path: '.babelrc', type: 'blob', mode: '100644', sha: '3', url: '' },
          { path: 'jest.config.js', type: 'blob', mode: '100644', sha: '4', url: '' },
          { path: 'webpack.config.js', type: 'blob', mode: '100644', sha: '5', url: '' },
        ],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'config');
      // Should find one of the config files
      expect([
        '.eslintrc.json',
        '.prettierrc.json',
        '.babelrc',
        'jest.config.js',
        'webpack.config.js',
      ]).toContain(result);
    });

    it('should find vite.config.ts', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [{ path: 'vite.config.ts', type: 'blob', mode: '100644', sha: '1', url: '' }],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'config');
      expect(result).toBe('vite.config.ts');
    });

    it('should find rollup.config.js', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [{ path: 'rollup.config.js', type: 'blob', mode: '100644', sha: '1', url: '' }],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'config');
      expect(result).toBe('rollup.config.js');
    });

    it('should return null when file type not found', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [{ path: 'index.html', type: 'blob', mode: '100644', sha: '1', url: '' }],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'package.json');
      expect(result).toBeNull();
    });

    it('should return null when tree is empty', async () => {
      const tree = { sha: 'abc', url: '', tree: [], truncated: false };

      const result = await service.getFileByType(tree, 'tsconfig');
      expect(result).toBeNull();
    });

    it('should only match files, not directories', async () => {
      const tree = {
        sha: 'abc',
        url: '',
        tree: [
          { path: 'tsconfig', type: 'tree', mode: '040000', sha: '1', url: '' },
          { path: 'tsconfig.json', type: 'blob', mode: '100644', sha: '2', url: '' },
        ],
        truncated: false,
      };

      const result = await service.getFileByType(tree, 'tsconfig');
      expect(result).toBe('tsconfig.json');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const mockTree = {
        sha: 'abc',
        url: '',
        tree: [],
        truncated: false,
      };

      mockOctokit.git.getTree.mockResolvedValue({ data: mockTree });

      // Cache a tree
      await service.getTree('owner', 'repo');
      expect(mockOctokit.git.getTree).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Second call should hit API again
      await service.getTree('owner', 'repo');
      expect(mockOctokit.git.getTree).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should wrap unknown errors as NetworkError', async () => {
      mockOctokit.git.getTree.mockRejectedValue(new Error('Unknown error'));

      await expect(service.getTree('owner', 'repo')).rejects.toThrow(NetworkError);
    });

    it('should include path in FileNotFoundError', async () => {
      mockOctokit.repos.getContent.mockRejectedValue({ status: 404 });

      try {
        await service.readFile('owner', 'repo', 'missing.txt');
      } catch (error: any) {
        expect(error).toBeInstanceOf(FileNotFoundError);
        expect(error.message).toContain('missing.txt');
      }
    });

    it('should preserve error codes for typed error handling', async () => {
      mockOctokit.git.getTree.mockRejectedValue({
        status: 403,
        message: 'API rate limit exceeded',
        response: { headers: { 'x-ratelimit-reset': '1234567890' } },
      });

      try {
        await service.getTree('owner', 'repo');
      } catch (error: any) {
        expect(error.code).toBe('RATE_LIMIT');
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow: get tree, find file, read content', async () => {
      // Mock tree response
      mockOctokit.git.getTree.mockResolvedValue({
        data: {
          sha: 'tree-sha',
          url: 'https://api.github.com/repos/test/repo/git/trees/tree-sha',
          tree: [
            { path: 'package.json', type: 'blob', mode: '100644', sha: 'pkg-sha', url: '' },
            { path: 'src', type: 'tree', mode: '040000', sha: 'src-sha', url: '' },
            { path: 'src/index.ts', type: 'blob', mode: '100644', sha: 'index-sha', url: '' },
            { path: 'README.md', type: 'blob', mode: '100644', sha: 'readme-sha', url: '' },
          ],
          truncated: false,
        },
      });

      // Mock file read
      const packageContent = { name: 'test', version: '1.0.0' };
      const encodedContent = Buffer.from(JSON.stringify(packageContent)).toString('base64');

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: encodedContent,
          type: 'file',
          path: 'package.json',
        },
      });

      // Execute workflow
      const tree = await service.getTree('test', 'repo');
      expect(tree.tree).toHaveLength(4);

      const tsFiles = await service.findByPattern(tree, 'src/**/*.ts');
      expect(tsFiles).toContain('src/index.ts');

      const pkgPath = await service.getFileByType(tree, 'package.json');
      expect(pkgPath).toBe('package.json');

      const content = await service.readFile('test', 'repo', 'package.json');
      expect(JSON.parse(content)).toEqual(packageContent);
    });
  });
});
