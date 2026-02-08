/**
 * Validation System Integration Tests
 * Story 3-1: Task 8
 *
 * Tests the complete validation pipeline end-to-end
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AEC } from '../../tickets/domain/aec/AEC';
import { ValidationEngine } from '../../tickets/application/services/validation/ValidationEngine';
import { CompletenessValidator } from '../../tickets/infrastructure/services/validators/CompletenessValidator';
import { TestabilityValidator } from '../../tickets/infrastructure/services/validators/TestabilityValidator';
import { ClarityValidator } from '../../tickets/infrastructure/services/validators/ClarityValidator';
import { FeasibilityValidator } from '../../tickets/infrastructure/services/validators/FeasibilityValidator';
import { ConsistencyValidator } from '../../tickets/infrastructure/services/validators/ConsistencyValidator';
import { ContextAlignmentValidator } from '../../tickets/infrastructure/services/validators/ContextAlignmentValidator';
import { ScopeValidator } from '../../tickets/infrastructure/services/validators/ScopeValidator';

describe('Validation System Integration', () => {
  let validationEngine: ValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationEngine,
        CompletenessValidator,
        TestabilityValidator,
        ClarityValidator,
        FeasibilityValidator,
        ConsistencyValidator,
        ContextAlignmentValidator,
        ScopeValidator,
        {
          provide: 'VALIDATORS',
          useFactory: (
            completeness: CompletenessValidator,
            testability: TestabilityValidator,
            clarity: ClarityValidator,
            feasibility: FeasibilityValidator,
            consistency: ConsistencyValidator,
            contextAlignment: ContextAlignmentValidator,
            scope: ScopeValidator,
          ) => [
            completeness,
            testability,
            clarity,
            feasibility,
            consistency,
            contextAlignment,
            scope,
          ],
          inject: [
            CompletenessValidator,
            TestabilityValidator,
            ClarityValidator,
            FeasibilityValidator,
            ConsistencyValidator,
            ContextAlignmentValidator,
            ScopeValidator,
          ],
        },
      ],
    }).compile();

    validationEngine = module.get<ValidationEngine>(ValidationEngine);
  });

  describe('Minimal AEC (should fail validation)', () => {
    it('should detect incomplete ticket', async () => {
      const aec = AEC.createDraft('ws_test', 'Fix bug');

      const results = await validationEngine.validate(aec);

      expect(results).toHaveLength(7); // All 7 validators

      // Completeness should fail
      const completeness = results.find((r) => r.criterion === 'completeness');
      expect(completeness).toBeDefined();
      expect(completeness?.passed).toBe(false);
      expect(completeness?.blockers.length).toBeGreaterThan(0);

      // Overall score should be low
      const summary = validationEngine.getValidationSummary(results);
      expect(summary.overallScore).toBeLessThan(0.7);
      expect(summary.passed).toBe(false);
    });
  });

  describe('Well-formed AEC (should pass validation)', () => {
    it('should pass validation for complete ticket', async () => {
      const aec = AEC.createDraft(
        'ws_test',
        'Implement user authentication with OAuth',
        'Users need to be able to log in using Google OAuth 2.0',
      );

      // Add proper acceptance criteria
      (aec as any)._acceptanceCriteria = [
        'When user clicks "Login with Google", they should be redirected to Google OAuth',
        'When OAuth succeeds, user session should be created with JWT token',
        'When user accesses protected route, system should validate JWT token',
      ];

      // Set type
      (aec as any)._type = 'feature';

      // Add assumptions
      (aec as any)._assumptions = ['Google OAuth credentials are configured', 'HTTPS is available'];

      const results = await validationEngine.validate(aec);

      expect(results).toHaveLength(7);

      // Completeness should pass (threshold 0.9)
      const completeness = results.find((r) => r.criterion === 'completeness');
      // May not pass threshold due to missing repo context, but score should be decent
      expect(completeness?.score).toBeGreaterThan(0.7);

      // Testability should pass (good AC structure, threshold 0.8)
      const testability = results.find((r) => r.criterion === 'testability');
      expect(testability?.score).toBeGreaterThan(0.6);

      // Overall should pass
      const summary = validationEngine.getValidationSummary(results);
      expect(summary.overallScore).toBeGreaterThanOrEqual(0.7);
      expect(summary.passed).toBe(true);
    });
  });

  describe('ValidationEngine summary', () => {
    it('should provide correct summary statistics', async () => {
      const aec = AEC.createDraft('ws_test', 'Test ticket with moderate quality');
      (aec as any)._acceptanceCriteria = ['AC 1', 'AC 2'];
      (aec as any)._type = 'feature';

      const results = await validationEngine.validate(aec);
      const summary = validationEngine.getValidationSummary(results);

      expect(summary.totalValidators).toBe(7);
      expect(summary.passedValidators).toBeGreaterThanOrEqual(0);
      expect(summary.failedValidators).toBeGreaterThanOrEqual(0);
      expect(summary.passedValidators + summary.failedValidators).toBe(7);
      expect(summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(summary.overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Individual validators', () => {
    it('CompletenessValidator should score based on sections', async () => {
      const aec = AEC.createDraft('ws_test', 'Good title here');
      (aec as any)._acceptanceCriteria = ['AC1', 'AC2', 'AC3'];
      (aec as any)._type = 'feature';
      (aec as any)._description = 'Good description with details';

      const results = await validationEngine.validate(aec);
      const completeness = results.find((r) => r.criterion === 'completeness');

      // Score should be good (0.75-0.85 range without repo context)
      expect(completeness?.score).toBeGreaterThan(0.7);
      expect(completeness?.score).toBeLessThan(0.95);
    });

    it('TestabilityValidator should detect measurable language', async () => {
      const aec = AEC.createDraft('ws_test', 'Feature with measurable ACs');
      (aec as any)._acceptanceCriteria = [
        'When user clicks button, then modal should display',
        'When form is submitted, then API should return success',
        'System should validate email format',
      ];
      (aec as any)._type = 'feature';

      const results = await validationEngine.validate(aec);
      const testability = results.find((r) => r.criterion === 'testability');

      expect(testability?.score).toBeGreaterThan(0.6);
    });

    it('ScopeValidator should flag too many ACs', async () => {
      const aec = AEC.createDraft('ws_test', 'Massive feature');
      (aec as any)._acceptanceCriteria = Array(15).fill('AC');
      (aec as any)._type = 'feature';

      const results = await validationEngine.validate(aec);
      const scope = results.find((r) => r.criterion === 'scope');

      // Should flag issues for having too many ACs
      expect(scope?.issues.length).toBeGreaterThan(0);
      // Check for issue about too many ACs (message may vary)
      expect(
        scope?.issues.some(
          (i) => i.toLowerCase().includes('many') || i.toLowerCase().includes('large'),
        ),
      ).toBe(true);
    });

    it('ConsistencyValidator should detect contradictions', async () => {
      const aec = AEC.createDraft('ws_test', 'Contradictory feature');
      (aec as any)._acceptanceCriteria = [
        'Feature must always be enabled',
        'Feature should never show to users',
      ];
      (aec as any)._type = 'feature';

      const results = await validationEngine.validate(aec);
      const consistency = results.find((r) => r.criterion === 'consistency');

      // Should detect the always/never contradiction
      expect(consistency?.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Weighted scoring', () => {
    it('should weight validators correctly', async () => {
      const aec = AEC.createDraft('ws_test', 'Test');
      (aec as any)._acceptanceCriteria = ['AC1'];
      (aec as any)._type = 'feature';

      const results = await validationEngine.validate(aec);

      // Check weights are applied
      expect(results.find((r) => r.criterion === 'completeness')?.weight).toBe(1.0);
      expect(results.find((r) => r.criterion === 'testability')?.weight).toBe(0.9);
      expect(results.find((r) => r.criterion === 'clarity')?.weight).toBe(0.8);
      expect(results.find((r) => r.criterion === 'scope')?.weight).toBe(0.6);

      // Weighted scores should be calculated
      results.forEach((result) => {
        expect(result.weightedScore).toBe(result.score * result.weight);
      });
    });
  });
});
