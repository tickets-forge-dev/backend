export type ValidatorType =
  | 'structural'
  | 'behavioral'
  | 'testability'
  | 'risk'
  | 'permissions';

export interface ValidationIssue {
  description: string;
  severity: 'blocker' | 'warning' | 'suggestion';
  suggestedFix?: string;
}

export interface ValidationResult {
  validatorType: ValidatorType;
  passed: boolean;
  score: number; // 0-100
  weight: number; // multiplier
  issues: ValidationIssue[];
  blockers: ValidationIssue[];
}
