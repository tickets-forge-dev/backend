/**
 * Index Domain Model Tests
 * 
 * Tests the Index aggregate root business logic.
 * 
 * Part of: Story 4.2 - Task 11 (Unit Tests)
 * Layer: Domain
 */

import { Index, IndexStatus } from '../Index';
import { FileMetadata } from '../FileMetadata';

describe('Index Domain Model', () => {
  describe('create', () => {
    it('should create index in pending status', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      expect(index.id).toBe('idx_123');
      expect(index.status).toBe('pending');
      expect(index.filesIndexed).toBe(0);
      expect(index.totalFiles).toBe(0);
      expect(index.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('markIndexing', () => {
    it('should transition from pending to indexing', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(100);

      expect(index.status).toBe('indexing');
      expect(index.totalFiles).toBe(100);
    });

    it('should throw error if not in pending status', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(100);

      expect(() => index.markIndexing(200)).toThrow('Index must be in pending status');
    });
  });

  describe('addFile', () => {
    it('should add file metadata and increment count', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(10);

      const fileMetadata = FileMetadata.create({
        path: 'src/index.ts',
        language: 'typescript',
        size: 1024,
        loc: 50,
        exports: ['main'],
        imports: ['express'],
        functions: ['main', 'start'],
        classes: [],
        summary: 'Main entry point',
      });

      index.addFile(fileMetadata);

      expect(index.files.length).toBe(1);
      expect(index.filesIndexed).toBe(1);
      expect(index.files[0].path).toBe('src/index.ts');
    });
  });

  describe('markComplete', () => {
    it('should transition to completed with duration', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(10);
      index.markComplete(5000);

      expect(index.status).toBe('completed');
      expect(index.indexDurationMs).toBe(5000);
      expect(index.completedAt).toBeInstanceOf(Date);
    });

    it('should throw error if not in indexing status', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      expect(() => index.markComplete(5000)).toThrow('Index must be in indexing status');
    });
  });

  describe('markFailed', () => {
    it('should transition to failed with error details', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(10);

      const error = {
        type: 'PARSE_ERROR',
        message: 'Failed to parse file',
        stack: 'Error: ...',
      };

      index.markFailed(error);

      expect(index.status).toBe('failed');
      expect(index.errorDetails).toEqual(error);
      expect(index.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('getProgress', () => {
    it('should return 0 for pending status', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      expect(index.getProgress()).toBe(0);
    });

    it('should calculate progress percentage', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(100);
      
      for (let i = 0; i < 50; i++) {
        index.addFile(FileMetadata.create({
          path: `file${i}.ts`,
          language: 'typescript',
          size: 100,
          loc: 10,
          exports: [],
          imports: [],
          functions: [],
          classes: [],
          summary: '',
        }));
      }

      expect(index.getProgress()).toBe(50);
    });

    it('should return 100 for completed status', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(10);
      index.markComplete(1000);

      expect(index.getProgress()).toBe(100);
    });
  });

  describe('getSuccessRate', () => {
    it('should return 100 if no errors', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(10);
      
      for (let i = 0; i < 10; i++) {
        index.addFile(FileMetadata.create({
          path: `file${i}.ts`,
          language: 'typescript',
          size: 100,
          loc: 10,
          exports: [],
          imports: [],
          functions: [],
          classes: [],
          summary: '',
        }));
      }

      expect(index.getSuccessRate()).toBe(100);
    });

    it('should calculate success rate with errors', () => {
      const index = Index.create({
        id: 'idx_123',
        workspaceId: 'ws_abc',
        repositoryId: 456,
        repositoryName: 'owner/repo',
        commitSha: 'abc123',
      });

      index.markIndexing(100);
      
      for (let i = 0; i < 80; i++) {
        index.addFile(FileMetadata.create({
          path: `file${i}.ts`,
          language: 'typescript',
          size: 100,
          loc: 10,
          exports: [],
          imports: [],
          functions: [],
          classes: [],
          summary: '',
        }));
      }

      // Simulate 20 parse errors
      for (let i = 0; i < 20; i++) {
        index.incrementParseErrors();
      }

      expect(index.getSuccessRate()).toBe(80);
    });
  });
});
