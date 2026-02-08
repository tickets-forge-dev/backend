/**
 * Validation Criteria Types for AEC Tickets
 * Story 3-1: 7 criteria for multi-dimensional validation
 */
export enum ValidatorType {
  COMPLETENESS = 'completeness',
  CLARITY = 'clarity',
  TESTABILITY = 'testability',
  FEASIBILITY = 'feasibility',
  CONSISTENCY = 'consistency',
  CONTEXT_ALIGNMENT = 'context_alignment',
  SCOPE = 'scope',
}

export interface ValidationIssue {
  description: string;
  severity: 'blocker' | 'warning' | 'suggestion';
  suggestedFix?: string;
}

export interface ValidationResultProps {
  criterion: ValidatorType;
  passed: boolean;
  score: number; // 0.0 to 1.0
  weight: number; // 0.0 to 1.0
  issues: string[];
  blockers: string[];
  message: string;
}

/**
 * ValidationResult Value Object
 * Represents the result of validating an AEC against a specific criterion
 */
export class ValidationResult {
  private constructor(
    public readonly criterion: ValidatorType,
    public readonly passed: boolean,
    public readonly score: number,
    public readonly weight: number,
    public readonly issues: string[],
    public readonly blockers: string[],
    public readonly message: string,
  ) {
    this.validate();
  }

  static create(props: ValidationResultProps): ValidationResult {
    return new ValidationResult(
      props.criterion,
      props.passed,
      props.score,
      props.weight,
      props.issues,
      props.blockers,
      props.message,
    );
  }

  private validate(): void {
    if (this.score < 0 || this.score > 1) {
      throw new Error('Score must be between 0.0 and 1.0');
    }
    if (this.weight < 0 || this.weight > 1) {
      throw new Error('Weight must be between 0.0 and 1.0');
    }
    if (!this.message || this.message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
  }

  /**
   * Calculate weighted score (score * weight)
   */
  get weightedScore(): number {
    return this.score * this.weight;
  }

  /**
   * Check if this validation criterion is passing
   */
  isPassing(): boolean {
    return this.passed;
  }

  /**
   * Check if there are critical issues that block progress
   */
  hasCriticalIssues(): boolean {
    return this.blockers.length > 0;
  }

  /**
   * Convert to plain object for persistence
   */
  toPlainObject(): ValidationResultProps {
    return {
      criterion: this.criterion,
      passed: this.passed,
      score: this.score,
      weight: this.weight,
      issues: this.issues,
      blockers: this.blockers,
      message: this.message,
    };
  }
}
