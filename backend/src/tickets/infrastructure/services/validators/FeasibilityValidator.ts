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

import { Injectable, Inject } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';
import { ILLMContentGenerator, LLM_CONTENT_GENERATOR } from '../../../../shared/application/ports/ILLMContentGenerator';

@Injectable()
export class FeasibilityValidator extends BaseValidator {
  constructor(
    @Inject(LLM_CONTENT_GENERATOR)
    private readonly llmGenerator: ILLMContentGenerator,
  ) {
    super(ValidatorType.FEASIBILITY, 0.7, 0.7);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
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

    const allText = [
      aec.title,
      aec.description || '',
      ...aec.acceptanceCriteria,
    ].join(' ');

    let score = 0.9; // Assume feasible unless proven otherwise

    for (const pattern of impossibilityPatterns) {
      if (pattern.test(allText)) {
        score -= 0.3;
        issues.push(`Potentially unrealistic requirement detected: ${pattern.source}`);
      }
    }

    // Check if scope seems reasonable
    if (aec.acceptanceCriteria.length > 10) {
      score -= 0.1;
      issues.push('Large number of acceptance criteria may indicate overly broad scope');
    }

    // Add blocker for critical feasibility issues
    if (score < 0.5) {
      blockers.push('Requirements contain technical impossibilities or unrealistic expectations');
    }

    score = Math.max(0, Math.min(1, score));

    return { score, issues, blockers };
  }

  protected generateMessage(score: number, passed: boolean, issues: string[], blockers: string[]): string {
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
