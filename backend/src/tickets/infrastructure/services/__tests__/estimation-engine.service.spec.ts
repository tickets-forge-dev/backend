/**
 * EstimationEngineService Unit Tests
 * 
 * Part of: Story 4.5 - Effort Estimation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EstimationEngineService } from '../estimation-engine.service';
import { EstimationParams } from '../../../application/services/estimation-engine.interface';

describe('EstimationEngineService', () => {
  let service: EstimationEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstimationEngineService],
    }).compile();

    service = module.get<EstimationEngineService>(EstimationEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('estimateEffort', () => {
    it('should calculate base effort of 2 hours (AC10)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'task',
        repoPaths: [],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      const estimate = await service.estimateEffort(params);

      expect(estimate.min).toBeGreaterThanOrEqual(2);
      expect(estimate.max).toBeGreaterThanOrEqual(2);
    });

    it('should add hours per module touched (AC11)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/module1.ts', 'src/module2.ts', 'src/module3.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      const estimate = await service.estimateEffort(params);

      // Base 2 + (3 modules * 1-2 hours) = 5-8 hours
      expect(estimate.min).toBeGreaterThanOrEqual(5);
      expect(estimate.max).toBeGreaterThanOrEqual(8);
      expect(estimate.drivers).toContain('3 modules touched');
    });

    it('should add hours for API changes (AC12)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: [],
        hasApiChanges: true,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      const estimate = await service.estimateEffort(params);

      // Base 2 + API 2-4 = 4-6 hours
      expect(estimate.min).toBeGreaterThanOrEqual(4);
      expect(estimate.drivers).toContain('API changes detected');
    });

    it('should add hours for DB migrations (AC13)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: [],
        hasApiChanges: false,
        hasDatabaseChanges: true,
        hasAuthChanges: false,
      };

      const estimate = await service.estimateEffort(params);

      // Base 2 + DB 3-6 = 5-8 hours
      expect(estimate.min).toBeGreaterThanOrEqual(5);
      expect(estimate.drivers).toContain('Database migrations required');
    });

    it('should add hours for auth changes (AC14)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: [],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: true,
      };

      const estimate = await service.estimateEffort(params);

      // Base 2 + Auth 2-3 = 4-5 hours
      expect(estimate.min).toBeGreaterThanOrEqual(4);
      expect(estimate.drivers).toContain('Auth logic changes');
    });

    it('should return low confidence when no historical data (AC16)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/module1.ts'],
        hasApiChanges: false,
        hasDatabaseChanges: false,
        hasAuthChanges: false,
      };

      const estimate = await service.estimateEffort(params);

      expect(estimate.confidence).toBe('low');
      expect(estimate.drivers).toContain('Limited historical data');
    });

    it('should limit to top 3 drivers (AC8)', async () => {
      const params: EstimationParams = {
        workspaceId: 'ws-1',
        repositoryName: 'test/repo',
        ticketType: 'feature',
        repoPaths: ['src/module1.ts'],
        hasApiChanges: true,
        hasDatabaseChanges: true,
        hasAuthChanges: true,
      };

      const estimate = await service.estimateEffort(params);

      expect(estimate.drivers.length).toBeLessThanOrEqual(3);
    });
  });
});
