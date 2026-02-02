/**
 * Consistency Validator
 * Story 3-1: Task 4.4
 * 
 * LLM-based validator that detects contradictions within the ticket.
 * 
 * Weight: 0.8
 * Pass Threshold: 0.7
 */

import { Injectable, Inject } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';
import { ILLMContentGenerator, LLM_CONTENT_GENERATOR } from '../../../../shared/application/ports/ILLMContentGenerator';

@Injectable()
export class ConsistencyValidator extends BaseValidator {
  constructor(
    @Inject(LLM_CONTENT_GENERATOR)
    private readonly llmGenerator: ILLMContentGenerator,
  ) {
    super(ValidatorType.CONSISTENCY, 0.8, 0.7);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
    const issues: string[] = [];
    const blockers: string[] = [];

    // Check for contradictions using heuristics
    const contradictionKeywords = [
      ['always', 'never'],
      ['must', 'optional'],
      ['required', 'optional'],
      ['public', 'private'],
      ['read-only', 'editable'],
    ];

    const allText = [
      aec.title,
      aec.description || '',
      ...aec.acceptanceCriteria,
      ...aec.assumptions,
    ].join(' ').toLowerCase();

    let contradictionCount = 0;

    for (const [word1, word2] of contradictionKeywords) {
      if (allText.includes(word1) && allText.includes(word2)) {
        contradictionCount++;
        issues.push(`Potential contradiction: both "${word1}" and "${word2}" mentioned`);
      }
    }

    // Check for conflicting acceptance criteria
    const acLower = aec.acceptanceCriteria.map(ac => ac.toLowerCase());
    for (let i = 0; i < acLower.length; i++) {
      for (let j = i + 1; j < acLower.length; j++) {
        if (this.detectOpposites(acLower[i], acLower[j])) {
          issues.push(`AC ${i + 1} and AC ${j + 1} may be contradictory`);
          contradictionCount++;
        }
      }
    }

    // Score based on contradictions
    let score = 1.0 - (contradictionCount * 0.2);
    score = Math.max(0, Math.min(1, score));

    if (contradictionCount > 2) {
      blockers.push('Multiple contradictions detected - requirements must be reconciled');
    }

    return { score, issues, blockers };
  }

  private detectOpposites(text1: string, text2: string): boolean {
    const opposites = [
      ['enable', 'disable'],
      ['show', 'hide'],
      ['allow', 'prevent'],
      ['create', 'delete'],
    ];

    for (const [word1, word2] of opposites) {
      if (text1.includes(word1) && text2.includes(word2)) {
        return true;
      }
      if (text1.includes(word2) && text2.includes(word1)) {
        return true;
      }
    }

    return false;
  }

  protected generateMessage(score: number, passed: boolean, issues: string[], blockers: string[]): string {
    if (blockers.length > 0) {
      return `Requirements contain contradictions: ${blockers[0]}`;
    }
    if (passed && issues.length === 0) {
      return 'Requirements are internally consistent';
    }
    if (passed) {
      return `Requirements are mostly consistent with minor conflicts`;
    }
    return `Requirements have contradictions (${Math.round(score * 100)}% consistent)`;
  }
}
