/**
 * Unit Tests for GitHubRepository Value Object
 * 
 * Tests domain business rules and validation logic.
 * No external dependencies - pure domain logic only.
 */

import { GitHubRepository, GitHubRepositoryProps } from '../GitHubRepository';

describe('GitHubRepository', () => {
  const validProps: GitHubRepositoryProps = {
    id: 123456,
    fullName: 'octocat/Hello-World',
    name: 'Hello-World',
    owner: 'octocat',
    private: false,
    defaultBranch: 'main',
    url: 'https://github.com/octocat/Hello-World',
  };

  describe('create', () => {
    it('should create repository with valid props', () => {
      const repo = GitHubRepository.create(validProps);

      expect(repo.id).toBe(123456);
      expect(repo.fullName).toBe('octocat/Hello-World');
      expect(repo.name).toBe('Hello-World');
      expect(repo.owner).toBe('octocat');
      expect(repo.isPrivate).toBe(false);
      expect(repo.defaultBranch).toBe('main');
      expect(repo.url).toBe('https://github.com/octocat/Hello-World');
    });

    it('should reject invalid repository ID', () => {
      expect(() =>
        GitHubRepository.create({ ...validProps, id: 0 }),
      ).toThrow('Repository ID must be a positive number');

      expect(() =>
        GitHubRepository.create({ ...validProps, id: -1 }),
      ).toThrow('Repository ID must be a positive number');
    });

    it('should reject empty full name', () => {
      expect(() =>
        GitHubRepository.create({ ...validProps, fullName: '' }),
      ).toThrow('Repository full name is required');

      expect(() =>
        GitHubRepository.create({ ...validProps, fullName: '   ' }),
      ).toThrow('Repository full name is required');
    });

    it('should reject empty name', () => {
      expect(() =>
        GitHubRepository.create({ ...validProps, name: '' }),
      ).toThrow('Repository name is required');
    });

    it('should reject empty owner', () => {
      expect(() =>
        GitHubRepository.create({ ...validProps, owner: '' }),
      ).toThrow('Repository owner is required');
    });

    it('should reject empty default branch', () => {
      expect(() =>
        GitHubRepository.create({ ...validProps, defaultBranch: '' }),
      ).toThrow('Default branch is required');
    });

    it('should reject invalid URL', () => {
      expect(() =>
        GitHubRepository.create({ ...validProps, url: 'not-a-url' }),
      ).toThrow('Valid repository URL is required');

      expect(() =>
        GitHubRepository.create({ ...validProps, url: 'http://github.com/octocat/Hello-World' }),
      ).toThrow('Valid repository URL is required');

      expect(() =>
        GitHubRepository.create({ ...validProps, url: 'https://gitlab.com/octocat/Hello-World' }),
      ).toThrow('Valid repository URL is required');
    });

    it('should reject mismatched fullName format', () => {
      expect(() =>
        GitHubRepository.create({ ...validProps, fullName: 'invalid' }),
      ).toThrow('Full name must be in format "owner/name"');

      expect(() =>
        GitHubRepository.create({ ...validProps, fullName: 'wrong/name' }),
      ).toThrow('Full name must be in format "owner/name"');

      expect(() =>
        GitHubRepository.create({ ...validProps, fullName: 'octocat/wrong' }),
      ).toThrow('Full name must be in format "owner/name"');
    });
  });

  describe('equals', () => {
    it('should return true for same repository', () => {
      const repo1 = GitHubRepository.create(validProps);
      const repo2 = GitHubRepository.create(validProps);

      expect(repo1.equals(repo2)).toBe(true);
    });

    it('should return false for different repository ID', () => {
      const repo1 = GitHubRepository.create(validProps);
      const repo2 = GitHubRepository.create({ ...validProps, id: 999999, fullName: 'other/repo', name: 'repo', owner: 'other', url: 'https://github.com/other/repo' });

      expect(repo1.equals(repo2)).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should serialize to plain object', () => {
      const repo = GitHubRepository.create(validProps);
      const obj = repo.toObject();

      expect(obj).toEqual(validProps);
    });
  });

  describe('immutability', () => {
    it('should not allow modification of props', () => {
      const repo = GitHubRepository.create(validProps);
      const obj = repo.toObject();

      // Attempt to modify returned object
      obj.name = 'Modified';

      // Original should remain unchanged
      expect(repo.name).toBe('Hello-World');
    });
  });
});
