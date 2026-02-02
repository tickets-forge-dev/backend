/**
 * Base Validator Class
 * Story 3-1: Task 2.2
 * 
 * Abstract base class providing common validation logic.
 * Concrete validators extend this and implement the scoring logic.
 */

import { AEC } from '../../../domain/aec/AEC';
import { ValidationResult, ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { IValidator } from './IValidator';

export abstract class BaseValidator implements IValidator {
  constructor(
    public readonly type: ValidatorType,
    public readonly weight: number,
    public readonly passThreshold: number,
  ) {
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.weight < 0 || this.weight > 1) {
      throw new Error(`Invalid weight ${this.weight} for ${this.type} validator`);
    }
    if (this.passThreshold < 0 || this.passThreshold > 1) {
      throw new Error(`Invalid passThreshold ${this.passThreshold} for ${this.type} validator`);
    }
  }

  /**
   * Validate an AEC and return a ValidationResult
   * Template method that calls abstract scoring methods
   */
  async validate(aec: AEC): Promise<ValidationResult> {
    // Run the specific validation logic
    const { score, issues, blockers } = await this.performValidation(aec);

    // Determine pass/fail based on threshold
    const passed = score >= this.passThreshold;

    // Generate message
    const message = this.generateMessage(score, passed, issues, blockers);

    return ValidationResult.create({
      criterion: this.type,
      passed,
      score,
      weight: this.weight,
      issues,
      blockers,
      message,
    });
  }

  /**
   * Perform the actual validation logic
   * Must be implemented by concrete validators
   */
  protected abstract performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }>;

  /**
   * Generate a human-readable message for the validation result
   * Can be overridden by concrete validators for custom messages
   */
  protected generateMessage(
    score: number,
    passed: boolean,
    issues: string[],
    blockers: string[],
  ): string {
    const percentage = Math.round(score * 100);
    
    if (passed && issues.length === 0) {
      return `${this.type} validation passed with ${percentage}% score`;
    }
    
    if (passed) {
      return `${this.type} validation passed with ${percentage}% score, but has ${issues.length} issue(s)`;
    }
    
    if (blockers.length > 0) {
      return `${this.type} validation failed (${percentage}%) with ${blockers.length} critical blocker(s)`;
    }
    
    return `${this.type} validation failed with ${percentage}% score`;
  }

  /**
   * Helper: Check if AEC has minimum required content
   */
  protected hasMinimumContent(aec: AEC): boolean {
    return (
      aec.title.length >= 3 &&
      aec.acceptanceCriteria.length > 0
    );
  }

  /**
   * Helper: Calculate score based on count vs minimum
   */
  protected calculateCountScore(actual: number, minimum: number, ideal: number): number {
    if (actual >= ideal) return 1.0;
    if (actual < minimum) return 0.0;
    
    // Linear interpolation between minimum and ideal
    return (actual - minimum) / (ideal - minimum);
  }
}
