/**
 * Testability Validator
 * Story 3-1: Task 3.2
 * 
 * Rule-based validator that checks if acceptance criteria are measurable
 * and ticket provides enough detail for QA testing.
 */

import { Injectable } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';

@Injectable()
export class TestabilityValidator extends BaseValidator {
  private readonly measurableKeywords = [
    'when', 'then', 'should', 'must', 'can', 'will',
    'displays', 'shows', 'returns', 'creates', 'updates', 'deletes',
    'validates', 'allows', 'prevents', 'redirects', 'sends',
  ];

  private readonly vagueWords = [
    'better', 'improved', 'good', 'nice', 'clean', 'properly',
    'correctly', 'well', 'appropriately', 'reasonable',
  ];

  constructor() {
    super(ValidatorType.TESTABILITY, 0.9, 0.8);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
    const issues: string[] = [];
    const blockers: string[] = [];
    let score = 0;

    // Check if ACs exist
    if (!aec.acceptanceCriteria || aec.acceptanceCriteria.length === 0) {
      blockers.push('No acceptance criteria to test against');
      return { score: 0, issues, blockers };
    }

    // Analyze each acceptance criterion
    let measurableCount = 0;
    let vagueCount = 0;
    let hasExpectedBehavior = 0;

    for (const ac of aec.acceptanceCriteria) {
      const lowerAc = ac.toLowerCase();

      // Check for measurable language
      const hasMeasurableKeyword = this.measurableKeywords.some(keyword =>
        lowerAc.includes(keyword),
      );

      if (hasMeasurableKeyword) {
        measurableCount++;
      }

      // Check for vague language
      const hasVagueWord = this.vagueWords.some(word => lowerAc.includes(word));
      if (hasVagueWord) {
        vagueCount++;
      }

      // Check for expected behavior (input -> output pattern)
      if (
        (lowerAc.includes('when') && lowerAc.includes('then')) ||
        (lowerAc.includes('given') && lowerAc.includes('when'))
      ) {
        hasExpectedBehavior++;
      }
    }

    // Score based on measurability
    const measurableRatio = measurableCount / aec.acceptanceCriteria.length;
    if (measurableRatio >= 0.8) {
      score += 0.4;
    } else if (measurableRatio >= 0.5) {
      score += 0.25;
      issues.push('Some acceptance criteria lack measurable language');
    } else {
      score += 0.1;
      issues.push('Most acceptance criteria are not measurable');
    }

    // Penalize vague language
    if (vagueCount > 0) {
      issues.push(`${vagueCount} AC(s) contain vague words that are hard to test`);
      score -= vagueCount * 0.05;
    }

    // Reward expected behavior patterns
    if (hasExpectedBehavior > 0) {
      score += Math.min(0.3, hasExpectedBehavior * 0.1);
    } else {
      issues.push('ACs could benefit from "Given-When-Then" or "When-Then" format');
    }

    // Check for test-related sections
    if (aec.type === 'feature' || aec.type === 'bug') {
      score += 0.2; // These types naturally have testable requirements
    } else {
      score += 0.1;
    }

    // Bonus for having detailed description
    if (aec.description && aec.description.length > 50) {
      score += 0.1;
    }

    // Ensure score is in valid range
    score = Math.max(0, Math.min(1, score));

    // Add blocker if score is critically low
    if (score < 0.4) {
      blockers.push('Acceptance criteria are not testable - add measurable outcomes');
    }

    return { score, issues, blockers };
  }

  protected generateMessage(score: number, passed: boolean, issues: string[], blockers: string[]): string {
    if (blockers.length > 0) {
      return `Ticket is not testable: ${blockers.join('; ')}`;
    }
    if (passed && issues.length === 0) {
      return 'Acceptance criteria are clear and testable';
    }
    if (passed) {
      return `Ticket is testable but could be clearer: ${issues.join('; ')}`;
    }
    return `Acceptance criteria need more measurable outcomes (${Math.round(score * 100)}% testable)`;
  }
}
