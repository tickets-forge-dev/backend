/**
 * ValidationEngine Service
 * Story 3-1: Task 5
 *
 * Orchestrates all validators and produces comprehensive validation results.
 * Runs validators in parallel for performance and calculates weighted scores.
 */

import { Injectable, Inject } from '@nestjs/common';
import { AEC } from '../../../domain/aec/AEC';
import { ValidationResult } from '../../../domain/value-objects/ValidationResult';
import { IValidator } from './IValidator';
import { ValidationMetrics, ValidationMetric } from './ValidationMetrics';

@Injectable()
export class ValidationEngine {
  constructor(
    @Inject('VALIDATORS')
    private readonly validators: IValidator[],
  ) {}

  /**
   * Validate an AEC against all registered validators
   * Runs validators in parallel for performance
   * Returns array of validation results
   */
  async validate(aec: AEC): Promise<ValidationResult[]> {
    console.log(`🔍 [ValidationEngine] Starting validation for AEC ${aec.id}`);
    console.log(`🔍 [ValidationEngine] Running ${this.validators.length} validators`);

    // Run all validators in parallel
    const startTime = Date.now();
    const results = await Promise.all(
      this.validators.map(async (validator) => {
        try {
          console.log(`  ⚙️  Running ${validator.type} validator...`);
          const result = await validator.validate(aec);
          console.log(
            `  ✓ ${validator.type}: ${(result.score * 100).toFixed(0)}% (${result.passed ? 'PASS' : 'FAIL'})`,
          );
          return result;
        } catch (error) {
          console.error(`  ✗ ${validator.type} validator failed:`, error);
          // Return a failing result if validator crashes
          return ValidationResult.create({
            criterion: validator.type,
            passed: false,
            score: 0,
            weight: validator.weight,
            issues: ['Validator encountered an error'],
            blockers: ['Validation could not complete'],
            message: `${validator.type} validation failed due to error`,
          });
        }
      }),
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [ValidationEngine] Validation complete in ${duration}ms`);

    // Calculate overall statistics
    const overallScore = this.calculateOverallScore(results);
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;

    console.log(`📊 [ValidationEngine] Overall Score: ${(overallScore * 100).toFixed(0)}%`);
    console.log(`📊 [ValidationEngine] Passed: ${passedCount}/${results.length}`);
    console.log(`📊 [ValidationEngine] Failed: ${failedCount}/${results.length}`);

    // Record metrics for telemetry
    const summary = this.getValidationSummary(results);
    const metric: ValidationMetric = {
      aecId: aec.id,
      workspaceId: aec.teamId,
      timestamp: new Date(),
      overallScore: summary.overallScore,
      passed: summary.passed,
      validatorScores: results.map((r) => ({
        validator: r.criterion,
        score: r.score,
        passed: r.passed,
      })),
      totalValidators: summary.totalValidators,
      passedValidators: summary.passedValidators,
      failedValidators: summary.failedValidators,
      totalIssues: summary.totalIssues,
      criticalIssues: summary.criticalIssues,
      duration,
    };
    ValidationMetrics.recordValidation(metric);

    return results;
  }

  /**
   * Calculate weighted overall score
   * Score = sum(validator.score * validator.weight) / sum(validator.weight)
   */
  private calculateOverallScore(results: ValidationResult[]): number {
    if (results.length === 0) return 0;

    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = results.reduce((sum, r) => sum + r.weightedScore, 0);

    return weightedSum / totalWeight;
  }

  /**
   * Get summary statistics for validation results
   */
  getValidationSummary(results: ValidationResult[]): {
    overallScore: number;
    passed: boolean;
    totalValidators: number;
    passedValidators: number;
    failedValidators: number;
    criticalIssues: number;
    totalIssues: number;
  } {
    const overallScore = this.calculateOverallScore(results);
    const passedValidators = results.filter((r) => r.passed).length;
    const criticalIssues = results.filter((r) => r.hasCriticalIssues()).length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    return {
      overallScore,
      passed: overallScore >= 0.7, // Overall threshold
      totalValidators: results.length,
      passedValidators,
      failedValidators: results.length - passedValidators,
      criticalIssues,
      totalIssues,
    };
  }
}
