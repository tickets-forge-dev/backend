/**
 * Validator Interface
 * Story 3-1: Task 2.1
 * 
 * Defines the contract that all validators must implement.
 * Each validator evaluates an AEC against a specific criterion.
 */

import { AEC } from '../../../domain/aec/AEC';
import { ValidationResult, ValidatorType } from '../../../domain/value-objects/ValidationResult';

export interface IValidator {
  /**
   * The type of validation criterion this validator checks
   */
  readonly type: ValidatorType;

  /**
   * The importance weight of this criterion (0.0 to 1.0)
   * Higher weight = more important in overall score
   */
  readonly weight: number;

  /**
   * Minimum score required to pass this criterion (0.0 to 1.0)
   */
  readonly passThreshold: number;

  /**
   * Validate an AEC against this criterion
   * @param aec - The AEC to validate
   * @returns ValidationResult with score, issues, and pass/fail status
   */
  validate(aec: AEC): Promise<ValidationResult>;
}
