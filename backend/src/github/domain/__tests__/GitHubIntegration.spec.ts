/**
 * Unit Tests for GitHubIntegration Entity
 *
 * Tests domain business rules, state transitions, and validation logic.
 * No external dependencies - pure domain logic only.
 */

import { GitHubIntegration } from '../GitHubIntegration';
import { GitHubRepository } from '../GitHubRepository';

describe('GitHubIntegration', () => {
  const validRepo = GitHubRepository.create({
    id: 123456,
    fullName: 'octocat/Hello-World',
    name: 'Hello-World',
    owner: 'octocat',
    private: false,
    defaultBranch: 'main',
    url: 'https://github.com/octocat/Hello-World',
  });

  describe('create', () => {
    it('should create integration with valid params', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'encrypted_token_abc123',
      );

      expect(integration.id).toBe('int_123');
      expect(integration.workspaceId).toBe('ws_456');
      expect(integration.installationId).toBe(789);
      expect(integration.accountLogin).toBe('octocat');
      expect(integration.accountType).toBe('User');
      expect(integration.encryptedAccessToken).toBe('encrypted_token_abc123');
      expect(integration.selectedRepositories).toEqual([]);
      expect(integration.connectedAt).toBeInstanceOf(Date);
      expect(integration.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject empty integration ID', () => {
      expect(() => GitHubIntegration.create('', 'ws_456', 789, 'octocat', 'User', 'token')).toThrow(
        'Integration ID is required',
      );
    });

    it('should reject empty workspace ID', () => {
      expect(() =>
        GitHubIntegration.create('int_123', '', 789, 'octocat', 'User', 'token'),
      ).toThrow('Workspace ID is required');
    });

    it('should reject invalid installation ID', () => {
      expect(() =>
        GitHubIntegration.create('int_123', 'ws_456', 0, 'octocat', 'User', 'token'),
      ).toThrow('Valid installation ID is required');

      expect(() =>
        GitHubIntegration.create('int_123', 'ws_456', -1, 'octocat', 'User', 'token'),
      ).toThrow('Valid installation ID is required');
    });

    it('should reject empty account login', () => {
      expect(() => GitHubIntegration.create('int_123', 'ws_456', 789, '', 'User', 'token')).toThrow(
        'Account login is required',
      );
    });

    it('should reject invalid account type', () => {
      expect(() =>
        GitHubIntegration.create('int_123', 'ws_456', 789, 'octocat', 'Invalid' as any, 'token'),
      ).toThrow('Account type must be User or Organization');
    });

    it('should reject empty encrypted token', () => {
      expect(() =>
        GitHubIntegration.create('int_123', 'ws_456', 789, 'octocat', 'User', ''),
      ).toThrow('Encrypted access token is required');
    });
  });

  describe('selectRepositories', () => {
    it('should select repositories', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      integration.selectRepositories([validRepo]);

      expect(integration.selectedRepositories).toHaveLength(1);
      expect(integration.selectedRepositories[0].id).toBe(123456);
      expect(integration.hasSelectedRepositories).toBe(true);
      expect(integration.selectedRepositoryCount).toBe(1);
    });

    it('should remove duplicate repositories', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      integration.selectRepositories([validRepo, validRepo, validRepo]);

      expect(integration.selectedRepositories).toHaveLength(1);
    });

    it('should replace existing selection', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      const repo2 = GitHubRepository.create({
        id: 999999,
        fullName: 'octocat/Another-Repo',
        name: 'Another-Repo',
        owner: 'octocat',
        private: false,
        defaultBranch: 'main',
        url: 'https://github.com/octocat/Another-Repo',
      });

      integration.selectRepositories([validRepo]);
      integration.selectRepositories([repo2]);

      expect(integration.selectedRepositories).toHaveLength(1);
      expect(integration.selectedRepositories[0].id).toBe(999999);
    });

    it('should reject non-array input', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      expect(() => integration.selectRepositories(null as any)).toThrow(
        'Repositories must be an array',
      );
    });

    it('should reject invalid repository objects', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      expect(() => integration.selectRepositories([{} as any])).toThrow(
        'Invalid repository at index 0',
      );
    });
  });

  describe('addRepositories', () => {
    it('should add repositories to existing selection', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      const repo2 = GitHubRepository.create({
        id: 999999,
        fullName: 'octocat/Another-Repo',
        name: 'Another-Repo',
        owner: 'octocat',
        private: false,
        defaultBranch: 'main',
        url: 'https://github.com/octocat/Another-Repo',
      });

      integration.selectRepositories([validRepo]);
      integration.addRepositories([repo2]);

      expect(integration.selectedRepositories).toHaveLength(2);
    });

    it('should not add duplicate repositories', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      integration.selectRepositories([validRepo]);
      integration.addRepositories([validRepo]);

      expect(integration.selectedRepositories).toHaveLength(1);
    });
  });

  describe('removeRepositories', () => {
    it('should remove repositories by ID', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      const repo2 = GitHubRepository.create({
        id: 999999,
        fullName: 'octocat/Another-Repo',
        name: 'Another-Repo',
        owner: 'octocat',
        private: false,
        defaultBranch: 'main',
        url: 'https://github.com/octocat/Another-Repo',
      });

      integration.selectRepositories([validRepo, repo2]);
      integration.removeRepositories([123456]);

      expect(integration.selectedRepositories).toHaveLength(1);
      expect(integration.selectedRepositories[0].id).toBe(999999);
    });

    it('should handle removing non-existent repository', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      integration.selectRepositories([validRepo]);
      integration.removeRepositories([999999]);

      expect(integration.selectedRepositories).toHaveLength(1);
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      const oldUpdatedAt = integration.updatedAt;

      // Wait a bit to ensure timestamp changes
      integration.updateAccessToken('new_encrypted_token');

      expect(integration.encryptedAccessToken).toBe('new_encrypted_token');
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('should reject empty token', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      expect(() => integration.updateAccessToken('')).toThrow('Encrypted access token is required');
    });
  });

  describe('isRepositorySelected', () => {
    it('should return true for selected repository', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      integration.selectRepositories([validRepo]);

      expect(integration.isRepositorySelected(123456)).toBe(true);
    });

    it('should return false for non-selected repository', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      expect(integration.isRepositorySelected(999999)).toBe(false);
    });
  });

  describe('getRepository', () => {
    it('should return repository by ID', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      integration.selectRepositories([validRepo]);

      const repo = integration.getRepository(123456);

      expect(repo).toBeDefined();
      expect(repo?.id).toBe(123456);
    });

    it('should return undefined for non-existent repository', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      const repo = integration.getRepository(999999);

      expect(repo).toBeUndefined();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute integration from persistence', () => {
      const props = {
        id: 'int_123',
        workspaceId: 'ws_456',
        installationId: 789,
        accountLogin: 'octocat',
        accountType: 'User' as const,
        encryptedAccessToken: 'token',
        selectedRepositories: [validRepo],
        connectedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const integration = GitHubIntegration.reconstitute(props);

      expect(integration.id).toBe('int_123');
      expect(integration.selectedRepositories).toHaveLength(1);
      expect(integration.connectedAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('toObject', () => {
    it('should serialize to plain object', () => {
      const integration = GitHubIntegration.create(
        'int_123',
        'ws_456',
        789,
        'octocat',
        'User',
        'token',
      );

      integration.selectRepositories([validRepo]);

      const obj = integration.toObject();

      expect(obj.id).toBe('int_123');
      expect(obj.selectedRepositories).toHaveLength(1);
      expect(obj.connectedAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });
  });
});
