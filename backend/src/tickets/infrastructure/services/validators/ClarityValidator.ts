/**
 * Clarity Validator
 * Story 3-1: Task 4.2
 *
 * LLM-based validator that assesses requirement clarity and identifies
 * vague or ambiguous statements.
 *
 * Weight: 0.8
 * Pass Threshold: 0.7
 */

import { Injectable } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';

interface ClarityAnalysis {
  score: number;
  vaguePhrases: string[];
  ambiguousStatements: string[];
  suggestions: string[];
}

@Injectable()
export class ClarityValidator extends BaseValidator {
  constructor() {
    super(ValidatorType.CLARITY, 0.8, 0.7);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
    console.log(`   🔍 [ClarityValidator] Analyzing requirement clarity...`);

    const issues: string[] = [];
    const blockers: string[] = [];

    // Combine all text for analysis
    const textToAnalyze = [
      aec.title,
      aec.description || '',
      ...aec.acceptanceCriteria,
      ...aec.assumptions,
    ].join('\n');

    console.log(`      📝 Analyzing ${textToAnalyze.length} chars of text...`);

    // Use LLM to analyze clarity
    const analysis = await this.analyzeClarityWithLLM(textToAnalyze);

    // Build issues list
    if (analysis.vaguePhrases.length > 0) {
      issues.push(
        `Found ${analysis.vaguePhrases.length} vague phrase(s): ${analysis.vaguePhrases.slice(0, 3).join(', ')}`,
      );
      console.log(`      ⚠️  ${analysis.vaguePhrases.length} vague phrases detected`);
    }

    if (analysis.ambiguousStatements.length > 0) {
      issues.push(`Found ${analysis.ambiguousStatements.length} ambiguous statement(s)`);
      console.log(`      ⚠️  ${analysis.ambiguousStatements.length} ambiguous statements`);
    }

    // Add suggestions as issues
    analysis.suggestions.forEach((suggestion) => issues.push(suggestion));

    // Critical blocker if score is very low
    if (analysis.score < 0.4) {
      blockers.push('Requirements are too vague to implement - needs significant clarification');
      console.log(`      ❌ Critical: Requirements too vague`);
    }

    console.log(
      `   📊 [ClarityValidator] Final score: ${(analysis.score * 100).toFixed(0)}%, Issues: ${issues.length}, Blockers: ${blockers.length}`,
    );

    return {
      score: analysis.score,
      issues,
      blockers,
    };
  }

  private async analyzeClarityWithLLM(text: string): Promise<ClarityAnalysis> {
    // Heuristic-based clarity scoring (LLM integration planned in future stories)
    const words = text.split(/\s+/).length;
    const hasNumbers = /\d/.test(text);
    const hasSpecifics = /\b(must|should|will|when|then|given)\b/i.test(text);

    let score = 0.5; // Base score

    if (words > 50) score += 0.2;
    if (hasNumbers) score += 0.15;
    if (hasSpecifics) score += 0.15;

    score = Math.min(1, score);

    return {
      score,
      vaguePhrases: [],
      ambiguousStatements: [],
      suggestions: score < 0.7 ? ['Add more specific details and measurable outcomes'] : [],
    };
  }

  protected generateMessage(
    score: number,
    passed: boolean,
    issues: string[],
    blockers: string[],
  ): string {
    if (blockers.length > 0) {
      return `Requirements lack clarity: ${blockers[0]}`;
    }
    if (passed && issues.length === 0) {
      return 'Requirements are clear and specific';
    }
    if (passed) {
      return `Requirements are mostly clear but could be improved`;
    }
    return `Requirements need clarification (${Math.round(score * 100)}% clarity)`;
  }
}
