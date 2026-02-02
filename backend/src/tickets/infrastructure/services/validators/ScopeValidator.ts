/**
 * Scope Validator
 * Story 3-1: Additional validator for scope appropriateness
 * 
 * Rule-based validator that checks if ticket scope is appropriate
 * (not too broad or too narrow for a single ticket).
 * 
 * Weight: 0.6
 * Pass Threshold: 0.6
 */

import { Injectable } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';

@Injectable()
export class ScopeValidator extends BaseValidator {
  constructor() {
    super(ValidatorType.SCOPE, 0.6, 0.6);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
    const issues: string[] = [];
    const blockers: string[] = [];
    let score = 0.7; // Neutral starting point

    // Check acceptance criteria count
    const acCount = aec.acceptanceCriteria.length;

    if (acCount === 0) {
      blockers.push('No acceptance criteria - cannot assess scope');
      return { score: 0, issues, blockers };
    }

    // Too few ACs might indicate narrow scope or lack of detail
    if (acCount === 1) {
      issues.push('Single acceptance criterion - scope may be too narrow or needs more detail');
      score -= 0.2;
    }

    // Too many ACs might indicate broad scope
    if (acCount > 8) {
      issues.push('Large number of acceptance criteria (>8) - consider breaking into multiple tickets');
      score -= 0.3;
      if (acCount > 12) {
        blockers.push('Scope too broad - must be split into multiple tickets');
      }
    }

    // Ideal range: 2-6 ACs
    if (acCount >= 2 && acCount <= 6) {
      score += 0.3;
    }

    // Check for scope indicators in text
    const allText = [aec.title, aec.description || '', ...aec.acceptanceCriteria].join(' ');

    const broadScopeIndicators = [
      /entire.*system/i,
      /all.*modules/i,
      /complete.*refactor/i,
      /redesign.*everything/i,
      /migrate.*all/i,
    ];

    for (const pattern of broadScopeIndicators) {
      if (pattern.test(allText)) {
        issues.push('Language suggests broad scope - consider narrowing');
        score -= 0.15;
      }
    }

    // Check repo paths count
    if (aec.repoPaths && aec.repoPaths.length > 10) {
      issues.push('Many file paths affected (>10) - scope may be too broad');
      score -= 0.1;
    }

    score = Math.max(0, Math.min(1, score));

    return { score, issues, blockers };
  }

  protected generateMessage(score: number, passed: boolean, issues: string[], blockers: string[]): string {
    if (blockers.length > 0) {
      return `Scope issues: ${blockers[0]}`;
    }
    if (passed && issues.length === 0) {
      return 'Ticket scope is appropriate for a single ticket';
    }
    if (passed) {
      return `Scope is acceptable but could be refined`;
    }
    return `Scope needs adjustment (${Math.round(score * 100)}% appropriate)`;
  }
}
