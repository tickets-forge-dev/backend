/**
 * ApiSpecIndexerImpl Unit Tests
 * 
 * Part of: Story 4.3 - OpenAPI Spec Sync
 * Layer: Infrastructure
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ApiSpecIndexerImpl } from '../api-spec-indexer.service';
import { API_SPEC_REPOSITORY } from '../../../domain/ApiSpecRepository';

describe('ApiSpecIndexerImpl', () => {
  let service: ApiSpecIndexerImpl;
  let mockRepository: any;
  let mockConfig: any;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRepo: jest.fn(),
    };

    mockConfig = {
      get: jest.fn().mockReturnValue('/tmp/forge-repos'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiSpecIndexerImpl,
        {
          provide: API_SPEC_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<ApiSpecIndexerImpl>(ApiSpecIndexerImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('indexApiSpecs', () => {
    it('should handle repos without OpenAPI specs gracefully (AC11)', async () => {
      // Mock: No spec file found
      await service.indexApiSpecs('workspace-1', 'test-repo', 'abc123');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          hasSpec: false,
          isValid: true,
          endpoints: [],
        }),
      );
    });
  });

  describe('findEndpointsByIntent', () => {
    it('should return empty array when spec has no spec (AC11)', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'spec-1',
        hasSpec: false,
        endpoints: [],
      });

      const result = await service.findEndpointsByIntent('user auth', 'spec-1');
      
      expect(result).toEqual([]);
    });

    it('should filter endpoints by intent keywords (AC9)', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'spec-1',
        hasSpec: true,
        endpoints: [
          {
            path: '/api/users',
            method: 'GET',
            summary: 'Get all users',
          },
          {
            path: '/api/posts',
            method: 'GET',
            summary: 'Get all posts',
          },
        ],
      });

      const result = await service.findEndpointsByIntent('user', 'spec-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/api/users');
    });
  });

  describe('getSpecByRepo', () => {
    it('should retrieve spec by workspace and repo name (AC9)', async () => {
      const mockSpec = {
        id: 'spec-1',
        workspaceId: 'workspace-1',
        repoName: 'test-repo',
      };

      mockRepository.findByRepo.mockResolvedValue(mockSpec);

      const result = await service.getSpecByRepo('workspace-1', 'test-repo');
      
      expect(result).toEqual(mockSpec);
      expect(mockRepository.findByRepo).toHaveBeenCalledWith('workspace-1', 'test-repo');
    });
  });
});
