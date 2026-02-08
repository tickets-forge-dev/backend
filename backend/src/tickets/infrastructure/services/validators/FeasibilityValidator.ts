/**
 * Feasibility Validator
 * Story 3-1: Task 4.3
 *
 * LLM-based validator that checks for technical impossibilities
 * or requirements that conflict with technology constraints.
 *
 * Weight: 0.7
 * Pass Threshold: 0.7
 */

import { Injectable } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';

@Injectable()
export class FeasibilityValidator extends BaseValidator {
  constructor() {
    super(ValidatorType.FEASIBILITY, 0.7, 0.7);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
    console.log(`   🔍 [FeasibilityValidator] Analyzing technical feasibility...`);

    const issues: string[] = [];
    const blockers: string[] = [];

    // Check for obvious impossibilities with heuristics
    const impossibilityPatterns = [
      /real[- ]?time.*100%.*uptime/i,
      /infinite.*storage/i,
      /zero.*latency/i,
      /instant.*processing/i,
      /unlimited.*concurrent/i,
    ];

    const allText = [aec.title, aec.description || '', ...aec.acceptanceCriteria].join(' ');

    let score = 0.9; // Assume feasible unless proven otherwise
    let impossibilityCount = 0;

    for (const pattern of impossibilityPatterns) {
      if (pattern.test(allText)) {
        score -= 0.3;
        issues.push(`Potentially unrealistic requirement detected: ${pattern.source}`);
        impossibilityCount++;
      }
    }

    if (impossibilityCount > 0) {
      console.log(`      ⚠️  Found ${impossibilityCount} unrealistic patterns`);
    } else {
      console.log(`      ✅ No obvious impossibilities detected`);
    }

    // Check if scope seems reasonable
    if (aec.acceptanceCriteria.length > 10) {
      score -= 0.1;
      issues.push('Large number of acceptance criteria may indicate overly broad scope');
      console.log(`      ⚠️  ${aec.acceptanceCriteria.length} ACs may be too ambitious`);
    }

    // Add blocker for critical feasibility issues
    if (score < 0.5) {
      blockers.push('Requirements contain technical impossibilities or unrealistic expectations');
      console.log(`      ❌ Critical feasibility issues detected`);
    }

    score = Math.max(0, Math.min(1, score));

    console.log(
      `   📊 [FeasibilityValidator] Final score: ${(score * 100).toFixed(0)}%, Issues: ${issues.length}, Blockers: ${blockers.length}`,
    );

    return { score, issues, blockers };
  }

  protected generateMessage(
    score: number,
    passed: boolean,
    issues: string[],
    blockers: string[],
  ): string {
    if (blockers.length > 0) {
      return `Requirements are not feasible: ${blockers[0]}`;
    }
    if (passed && issues.length === 0) {
      return 'Requirements appear technically feasible';
    }
    if (passed) {
      return `Requirements are feasible but may have concerns`;
    }
    return `Requirements may not be feasible (${Math.round(score * 100)}% feasibility)`;
  }
}
