/**
 * Completeness Validator
 * Story 3-1: Task 3.1
 * 
 * Rule-based validator that checks if all required sections are present
 * and have minimum content length.
 */

import { Injectable } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';

@Injectable()
export class CompletenessValidator extends BaseValidator {
  constructor() {
    super(ValidatorType.COMPLETENESS, 1.0, 0.9);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
    console.log(`   🔍 [CompletenessValidator] Analyzing ticket completeness...`);
    
    const issues: string[] = [];
    const blockers: string[] = [];
    let score = 0;

    // Check 1: Title (required)
    if (!aec.title || aec.title.length < 3) {
      blockers.push('Title is missing or too short (minimum 3 characters)');
      console.log(`      ❌ Title too short: "${aec.title}"`);
    } else if (aec.title.length < 10) {
      issues.push('Title is very short, consider adding more context');
      score += 0.15;
      console.log(`      ⚠️  Title short but acceptable: ${aec.title.length} chars`);
    } else {
      score += 0.25;
      console.log(`      ✅ Title length good: ${aec.title.length} chars`);
    }

    // Check 2: Type detected (required)
    if (!aec.type) {
      blockers.push('Ticket type not detected (feature/bug/refactor/docs)');
      console.log(`      ❌ No ticket type detected`);
    } else {
      score += 0.15;
      console.log(`      ✅ Type detected: ${aec.type}`);
    }

    // Check 3: Acceptance Criteria (required)
    if (!aec.acceptanceCriteria || aec.acceptanceCriteria.length === 0) {
      blockers.push('No acceptance criteria defined');
      console.log(`      ❌ No acceptance criteria`);
    } else if (aec.acceptanceCriteria.length < 2) {
      issues.push('Only 1 acceptance criterion - consider adding more detail');
      score += 0.15;
      console.log(`      ⚠️  Only 1 AC found`);
    } else if (aec.acceptanceCriteria.length < 3) {
      score += 0.2;
      console.log(`      ✅ ${aec.acceptanceCriteria.length} ACs found`);
    } else {
      score += 0.25;
      console.log(`      ✅ ${aec.acceptanceCriteria.length} ACs found (ideal)`);
    }

    // Check 4: Description or Assumptions (recommended)
    const hasDescription = aec.description && aec.description.trim().length > 0;
    const hasAssumptions = aec.assumptions && aec.assumptions.length > 0;

    if (!hasDescription && !hasAssumptions) {
      issues.push('No description or assumptions - adds helpful context');
      score += 0.05;
      console.log(`      ⚠️  No description or assumptions`);
    } else {
      score += 0.15;
      console.log(`      ✅ Has ${hasDescription ? 'description' : ''}${hasDescription && hasAssumptions ? ' and ' : ''}${hasAssumptions ? 'assumptions' : ''}`);
    }

    // Check 5: Repository paths (optional)
    if (aec.repoPaths && aec.repoPaths.length > 0) {
      score += 0.1;
      console.log(`      ✅ Has ${aec.repoPaths.length} repository paths`);
    } else {
      score += 0.05;
      console.log(`      ℹ️  No repository paths (optional)`);
    }

    // Check 6: Repository context (if provided)
    if (aec.repositoryContext) {
      score += 0.1;
      console.log(`      ✅ Has repository context`);
    }

    console.log(`   📊 [CompletenessValidator] Final score: ${(score * 100).toFixed(0)}%, Issues: ${issues.length}, Blockers: ${blockers.length}`);

    return { score, issues, blockers };
  }

  protected generateMessage(score: number, passed: boolean, issues: string[], blockers: string[]): string {
    if (blockers.length > 0) {
      return `Ticket is incomplete: ${blockers.join('; ')}`;
    }
    if (passed && issues.length === 0) {
      return 'Ticket is complete with all required sections';
    }
    if (passed) {
      return `Ticket is complete but could be improved: ${issues.join('; ')}`;
    }
    return `Ticket needs more detail (${Math.round(score * 100)}% complete)`;
  }
}
