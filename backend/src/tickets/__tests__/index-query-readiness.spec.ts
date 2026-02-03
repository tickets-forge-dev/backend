/**
 * IndexQueryService Tests - Phase B Fix #8
 * 
 * Tests for workspace readiness check before querying
 */

import { Test, TestingModule } from '@nestjs/testing';
import { IndexQueryService } from '../../indexing/application/services/index-query.service';
import { IndexRepository, INDEX_REPOSITORY } from '../../indexing/domain/IndexRepository';
import { Index } from '../../indexing/domain/Index';

describe('IndexQueryService - Workspace Readiness (Fix #8)', () => {
  let service: IndexQueryService;
  let mockIndexRepository: jest.Mocked<IndexRepository>;

  beforeEach(async () => {
    mockIndexRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndexQueryService,
        {
          provide: INDEX_REPOSITORY,
          useValue: mockIndexRepository,
        },
      ],
    }).compile();

    service = module.get<IndexQueryService>(IndexQueryService);
  });

  describe('getIndexStatus', () => {
    it('should return ready status for completed index', async () => {
      const mockIndex = {
        id: 'index-123',
        status: 'completed',
        filesIndexed: 150,
        totalFiles: 150,
        filesSkipped: 5,
        parseErrors: 0,
      } as Index;

      mockIndexRepository.findById.mockResolvedValue(mockIndex);

      const result = await service.getIndexStatus('index-123');

      expect(result).toEqual({
        exists: true,
        status: 'completed',
        ready: true,
        message: 'Index ready (150 files indexed)',
      });
    });

    it('should return not ready status for in-progress index', async () => {
      const mockIndex = {
        id: 'index-123',
        status: 'in-progress',
        filesIndexed: 75,
        totalFiles: 150,
        filesSkipped: 0,
        parseErrors: 0,
      } as Index;

      mockIndexRepository.findById.mockResolvedValue(mockIndex);

      const result = await service.getIndexStatus('index-123');

      expect(result).toEqual({
        exists: true,
        status: 'in-progress',
        ready: false,
        message: 'Indexing in progress (75/150 files)',
      });
    });

    it('should return not ready status for failed index', async () => {
      const mockIndex = {
        id: 'index-123',
        status: 'failed',
        filesIndexed: 50,
        totalFiles: 150,
        filesSkipped: 0,
        parseErrors: 100,
      } as Index;

      mockIndexRepository.findById.mockResolvedValue(mockIndex);

      const result = await service.getIndexStatus('index-123');

      expect(result).toEqual({
        exists: true,
        status: 'failed',
        ready: false,
        message: 'Indexing failed',
      });
    });

    it('should return not found for non-existent index', async () => {
      mockIndexRepository.findById.mockResolvedValue(null);

      const result = await service.getIndexStatus('non-existent');

      expect(result).toEqual({
        exists: false,
        status: 'unknown',
        ready: false,
        message: 'Index not found',
      });
    });

    it('should handle errors gracefully', async () => {
      mockIndexRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.getIndexStatus('index-123');

      expect(result.exists).toBe(false);
      expect(result.ready).toBe(false);
      expect(result.status).toBe('unknown');
      expect(result.message).toContain('Error checking index');
    });
  });

  describe('findModulesByIntent - with readiness check', () => {
    it('should throw error if index not ready (in-progress)', async () => {
      const mockIndex = {
        id: 'index-123',
        status: 'in-progress',
        filesIndexed: 50,
        totalFiles: 100,
        files: [],
      } as Index;

      mockIndexRepository.findById.mockResolvedValue(mockIndex);

      await expect(
        service.findModulesByIntent('user authentication', 'index-123'),
      ).rejects.toThrow('Index not ready: in-progress');
    });

    it('should throw error if index not ready (failed)', async () => {
      const mockIndex = {
        id: 'index-123',
        status: 'failed',
        filesIndexed: 10,
        totalFiles: 100,
        files: [],
      } as Index;

      mockIndexRepository.findById.mockResolvedValue(mockIndex);

      await expect(
        service.findModulesByIntent('user authentication', 'index-123'),
      ).rejects.toThrow('Index not ready: failed');
    });

    it('should succeed if index is completed', async () => {
      const mockIndex = {
        id: 'index-123',
        status: 'completed',
        filesIndexed: 100,
        totalFiles: 100,
        files: [
          {
            path: 'src/auth/auth.service.ts',
            language: 'typescript',
            exports: ['AuthService'],
            imports: ['jwt'],
            functions: ['login', 'verify'],
            classes: ['AuthService'],
            summary: 'Authentication service',
            getSymbolCount: () => 3,
          },
        ],
      } as Index;

      mockIndexRepository.findById.mockResolvedValue(mockIndex);

      const modules = await service.findModulesByIntent(
        'user authentication',
        'index-123',
      );

      expect(modules).toBeDefined();
      expect(modules.length).toBeGreaterThan(0);
    });
  });
});
