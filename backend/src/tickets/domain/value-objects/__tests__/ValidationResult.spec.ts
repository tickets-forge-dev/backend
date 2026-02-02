/**
 * ValidationResult Value Object Unit Tests
 * Story 3-1: Task 1.4
 */

import { ValidationResult, ValidatorType } from '../ValidationResult';

describe('ValidationResult', () => {
  describe('create', () => {
    it('should create a valid ValidationResult', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.COMPLETENESS,
        passed: true,
        score: 0.9,
        weight: 1.0,
        issues: [],
        blockers: [],
        message: 'All required sections present',
      });

      expect(result.criterion).toBe(ValidatorType.COMPLETENESS);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(0.9);
      expect(result.weight).toBe(1.0);
      expect(result.message).toBe('All required sections present');
    });

    it('should throw error if score is out of range', () => {
      expect(() =>
        ValidationResult.create({
          criterion: ValidatorType.CLARITY,
          passed: false,
          score: 1.5, // Invalid
          weight: 0.8,
          issues: ['Vague requirements'],
          blockers: [],
          message: 'Requirements lack clarity',
        }),
      ).toThrow('Score must be between 0.0 and 1.0');
    });

    it('should throw error if weight is out of range', () => {
      expect(() =>
        ValidationResult.create({
          criterion: ValidatorType.CLARITY,
          passed: false,
          score: 0.5,
          weight: 1.5, // Invalid
          issues: ['Vague requirements'],
          blockers: [],
          message: 'Requirements lack clarity',
        }),
      ).toThrow('Weight must be between 0.0 and 1.0');
    });

    it('should throw error if message is empty', () => {
      expect(() =>
        ValidationResult.create({
          criterion: ValidatorType.CLARITY,
          passed: false,
          score: 0.5,
          weight: 0.8,
          issues: ['Vague requirements'],
          blockers: [],
          message: '', // Invalid
        }),
      ).toThrow('Message cannot be empty');
    });
  });

  describe('weightedScore', () => {
    it('should calculate weighted score correctly', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.TESTABILITY,
        passed: true,
        score: 0.8,
        weight: 0.9,
        issues: [],
        blockers: [],
        message: 'Acceptance criteria are measurable',
      });

      expect(result.weightedScore).toBeCloseTo(0.72, 2);
    });

    it('should return 0 when score is 0', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.FEASIBILITY,
        passed: false,
        score: 0,
        weight: 1.0,
        issues: ['Technical impossibility detected'],
        blockers: ['Cannot implement with current stack'],
        message: 'Requirements not feasible',
      });

      expect(result.weightedScore).toBe(0);
    });
  });

  describe('isPassing', () => {
    it('should return true when passed is true', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.CONSISTENCY,
        passed: true,
        score: 0.95,
        weight: 0.7,
        issues: [],
        blockers: [],
        message: 'No contradictions found',
      });

      expect(result.isPassing()).toBe(true);
    });

    it('should return false when passed is false', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.CONSISTENCY,
        passed: false,
        score: 0.45,
        weight: 0.7,
        issues: ['Contradicting requirements in sections 2 and 5'],
        blockers: [],
        message: 'Inconsistencies detected',
      });

      expect(result.isPassing()).toBe(false);
    });
  });

  describe('hasCriticalIssues', () => {
    it('should return true when blockers exist', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.SCOPE,
        passed: false,
        score: 0.3,
        weight: 0.6,
        issues: ['Scope is too broad'],
        blockers: ['Scope must be narrowed before implementation'],
        message: 'Scope too large for single ticket',
      });

      expect(result.hasCriticalIssues()).toBe(true);
    });

    it('should return false when no blockers', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.SCOPE,
        passed: true,
        score: 0.85,
        weight: 0.6,
        issues: [],
        blockers: [],
        message: 'Scope is appropriate',
      });

      expect(result.hasCriticalIssues()).toBe(false);
    });
  });

  describe('toPlainObject', () => {
    it('should convert to plain object for persistence', () => {
      const result = ValidationResult.create({
        criterion: ValidatorType.CONTEXT_ALIGNMENT,
        passed: true,
        score: 0.88,
        weight: 0.7,
        issues: [],
        blockers: [],
        message: 'Suggested files align with repository structure',
      });

      const plain = result.toPlainObject();

      expect(plain).toEqual({
        criterion: ValidatorType.CONTEXT_ALIGNMENT,
        passed: true,
        score: 0.88,
        weight: 0.7,
        issues: [],
        blockers: [],
        message: 'Suggested files align with repository structure',
      });
    });
  });

  describe('ValidatorType enum', () => {
    it('should have all 7 validation criteria', () => {
      const types = Object.values(ValidatorType);

      expect(types).toContain('completeness');
      expect(types).toContain('clarity');
      expect(types).toContain('testability');
      expect(types).toContain('feasibility');
      expect(types).toContain('consistency');
      expect(types).toContain('context_alignment');
      expect(types).toContain('scope');
      expect(types.length).toBe(7);
    });
  });
});
