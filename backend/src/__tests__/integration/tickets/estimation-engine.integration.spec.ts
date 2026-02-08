/**
 * Effort Estimation Integration Tests
 * Tests estimation calculations with various scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EstimationEngineService } from '../../../tickets/infrastructure/services/estimation-engine.service';
import { EstimationParams } from '../../../tickets/application/services/estimation-engine.interface';

describe('Effort Estimation Integration', () => {
  let service: EstimationEngineService;
  let mockFirestore: any;

  beforeEach(async () => {
    mockFirestore = createFirestoreMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EstimationEngineService],
    }).compile();

    service = module.get<EstimationEngineService>(EstimationEngineService);
    (service as any).firestore = mockFirestore;
  });

  describe('Basic Calculations', () => {
    it('should calculate minimum estimate (2 hours)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'task',
        repoPaths: [],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      expect(estimate.min).toBeGreaterThanOrEqual(2);
      expect(estimate.max).toBeGreaterThanOrEqual(2);
      expect(estimate.confidence).toBe('low');
    });

    it('should add hours for each module', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/service.ts', 'src/controller.ts', 'src/model.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      // Base 2 + (3 modules * 1-2) = 5-8 hours
      expect(estimate.min).toBeGreaterThanOrEqual(5);
      expect(estimate.max).toBeGreaterThanOrEqual(8);
      expect(estimate.drivers).toContain('3 modules touched');
    });

    it('should add hours for API changes', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: [],
        hasApiChanges: true,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      // Base 2 + API 2-4 = 4-6 hours
      expect(estimate.min).toBeGreaterThanOrEqual(4);
      expect(estimate.drivers).toContain('API changes detected');
    });

    it('should add hours for database changes', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: [],
        hasApiChanges: false,
        hasDatabaseChanges: true,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      // Base 2 + DB 3-6 = 5-8 hours
      expect(estimate.min).toBeGreaterThanOrEqual(5);
      expect(estimate.drivers).toContain('Database migrations required');
    });

    it('should add hours for auth changes', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: [],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: true,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      // Base 2 + Auth 2-3 = 4-5 hours
      expect(estimate.min).toBeGreaterThanOrEqual(4);
      expect(estimate.drivers).toContain('Auth logic changes');
    });
  });

  describe('Complex Scenarios', () => {
    it('should calculate estimate for complex ticket', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/auth.ts', 'src/user.ts', 'src/api.ts'],
        hasApiChanges: true,
        hasDatabaseChanges: true,
        hasAuthChanges: true,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      // Base 2 + (3 modules * 1-2) + API 2-4 + DB 3-6 + Auth 2-3 = 12-20 hours
      expect(estimate.min).toBeGreaterThanOrEqual(10);
      expect(estimate.max).toBeGreaterThanOrEqual(15);
      expect(estimate.drivers.length).toBeLessThanOrEqual(3);
    });

    it('should limit to top 3 drivers', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['file1.ts'],
        hasApiChanges: true,
        hasDatabaseChanges: true,
        hasAuthChanges: true,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      expect(estimate.drivers.length).toBe(3);
    });
  });

  describe('Confidence Levels', () => {
    it('should return low confidence with no historical data', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/file.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      expect(estimate.confidence).toBe('low');
      expect(estimate.drivers).toContain('Limited historical data');
    });

    it('should return medium confidence with some historical data', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/file.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [{}, {}, {}], // 3 historical tickets
        });

      const estimate = await service.estimateEffort(params);

      expect(estimate.confidence).toBe('medium');
    });

    it('should return high confidence with 5+ historical tickets', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/file.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [{}, {}, {}, {}, {}, {}], // 6 historical tickets
        });

      const estimate = await service.estimateEffort(params);

      expect(estimate.confidence).toBe('high');
    });

    it('should narrow range for high confidence', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/file.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [{}, {}, {}, {}, {}, {}],
        });

      const estimate = await service.estimateEffort(params);

      const range = estimate.max - estimate.min;
      expect(range).toBeLessThanOrEqual(4); // Narrow range
    });

    it('should widen range for low confidence', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/file.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      expect(estimate.min).toBe(4); // Wide range minimum
      expect(estimate.max).toBeLessThanOrEqual(12); // Wide range maximum
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty repo paths', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'task',
        repoPaths: [],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          docs: [],
        });

      const estimate = await service.estimateEffort(params);

      expect(estimate).toBeDefined();
      expect(estimate.min).toBeGreaterThanOrEqual(2);
    });

    it('should handle Firestore query failure', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/file.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      mockFirestore
        .collection()
        .doc()
        .collection()
        .where()
        .where()
        .where()
        .limit()
        .get.mockRejectedValue(new Error('Firestore error'));

      const estimate = await service.estimateEffort(params);

      // Should handle error gracefully and return estimate
      expect(estimate).toBeDefined();
      expect(estimate.confidence).toBe('low');
    });
  });
});

function createFirestoreMock() {
  const getMock = jest.fn();
  const whereMock = jest.fn();
  const limitMock = jest.fn();
  const docMock = jest.fn();
  const collectionMock = jest.fn();

  limitMock.mockReturnValue({ get: getMock });
  whereMock.mockReturnValue({ where: whereMock, limit: limitMock, get: getMock });
  docMock.mockReturnValue({ collection: collectionMock });
  collectionMock.mockReturnValue({ doc: docMock, where: whereMock });

  return {
    collection: collectionMock,
  };
}
