import { Test, TestingModule } from '@nestjs/testing';
import { MastraWorkspaceFactory } from '../MastraWorkspaceFactory';

describe('MastraWorkspaceFactory', () => {
  let factory: MastraWorkspaceFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MastraWorkspaceFactory],
    }).compile();

    factory = module.get<MastraWorkspaceFactory>(MastraWorkspaceFactory);
  });

  afterEach(() => {
    // Clear all workspaces after each test
    factory.clearAll();
  });

  describe('getWorkspace', () => {
    it('should create a new workspace', async () => {
      const workspace = await factory.getWorkspace(
        'test-workspace-id',
        'user/repo',
        'test-index-id',
      );

      expect(workspace).toBeDefined();
      expect(factory.hasWorkspace('test-workspace-id', 'user/repo')).toBe(
        true,
      );
    });

    it('should reuse cached workspace for same repo', async () => {
      const workspace1 = await factory.getWorkspace(
        'test-workspace-id',
        'user/repo',
        'test-index-id',
      );

      const workspace2 = await factory.getWorkspace(
        'test-workspace-id',
        'user/repo',
        'test-index-id',
      );

      expect(workspace1).toBe(workspace2); // Same instance
    });

    it('should create different workspaces for different repos', async () => {
      const workspace1 = await factory.getWorkspace(
        'test-workspace-id',
        'user/repo1',
        'test-index-1',
      );

      const workspace2 = await factory.getWorkspace(
        'test-workspace-id',
        'user/repo2',
        'test-index-2',
      );

      expect(workspace1).not.toBe(workspace2);
    });
  });

  describe('clearWorkspace', () => {
    it('should remove workspace from cache', async () => {
      await factory.getWorkspace(
        'test-workspace-id',
        'user/repo',
        'test-index-id',
      );

      expect(factory.hasWorkspace('test-workspace-id', 'user/repo')).toBe(
        true,
      );

      factory.clearWorkspace('test-workspace-id', 'user/repo');

      expect(factory.hasWorkspace('test-workspace-id', 'user/repo')).toBe(
        false,
      );
    });
  });

  describe('clearAll', () => {
    it('should clear all workspace caches', async () => {
      await factory.getWorkspace('ws1', 'user/repo1', 'idx1');
      await factory.getWorkspace('ws2', 'user/repo2', 'idx2');

      const statsBefore = factory.getCacheStats();
      expect(statsBefore.size).toBe(2);

      factory.clearAll();

      const statsAfter = factory.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      await factory.getWorkspace('ws1', 'user/repo1', 'idx1');
      await factory.getWorkspace('ws2', 'user/repo2', 'idx2');

      const stats = factory.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.workspaces).toHaveLength(2);
      expect(stats.workspaces).toContain('ws1-user-repo1');
      expect(stats.workspaces).toContain('ws2-user-repo2');
    });
  });

  describe('hasWorkspace', () => {
    it('should return false for non-existent workspace', () => {
      expect(factory.hasWorkspace('test-workspace-id', 'user/repo')).toBe(
        false,
      );
    });

    it('should return true for existing workspace', async () => {
      await factory.getWorkspace(
        'test-workspace-id',
        'user/repo',
        'test-index-id',
      );

      expect(factory.hasWorkspace('test-workspace-id', 'user/repo')).toBe(
        true,
      );
    });
  });
});
