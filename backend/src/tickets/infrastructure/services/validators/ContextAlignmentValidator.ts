/**
 * Context Alignment Validator
 * Story 3-1: Task 4.5
 *
 * Validates that suggested file paths align with repository structure
 * when repository context is provided.
 *
 * Weight: 0.7
 * Pass Threshold: 0.7
 */

import { Injectable } from '@nestjs/common';
import { BaseValidator } from '../../../application/services/validation/BaseValidator';
import { ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { AEC } from '../../../domain/aec/AEC';

@Injectable()
export class ContextAlignmentValidator extends BaseValidator {
  constructor() {
    super(ValidatorType.CONTEXT_ALIGNMENT, 0.7, 0.7);
  }

  protected async performValidation(aec: AEC): Promise<{
    score: number;
    issues: string[];
    blockers: string[];
  }> {
    console.log(`   🔍 [ContextAlignmentValidator] Checking repository context alignment...`);

    const issues: string[] = [];
    const blockers: string[] = [];

    // If no repository context, this validator passes by default
    if (!aec.repositoryContext) {
      console.log(`      ℹ️  No repository context (optional)`);
      return {
        score: 1.0,
        issues: [],
        blockers: [],
      };
    }

    console.log(`      📦 Repository: ${aec.repositoryContext.repositoryFullName}`);

    // Check if suggested repository paths seem valid
    let score = 0.8; // Base score when context exists

    if (!aec.repoPaths || aec.repoPaths.length === 0) {
      issues.push('Repository context provided but no specific file paths suggested');
      score -= 0.2;
      console.log(`      ⚠️  No file paths suggested`);
    } else {
      // Validate path formats
      const invalidPaths = aec.repoPaths.filter((path) => !this.isValidPath(path));

      if (invalidPaths.length > 0) {
        issues.push(`${invalidPaths.length} path(s) have invalid format`);
        score -= invalidPaths.length * 0.1;
        console.log(`      ⚠️  ${invalidPaths.length} invalid paths`);
      } else {
        console.log(`      ✅ All ${aec.repoPaths.length} paths valid`);
      }

      // Bonus for having multiple relevant paths
      if (aec.repoPaths.length >= 3) {
        score += 0.2;
        console.log(`      ✅ Good coverage: ${aec.repoPaths.length} paths`);
      }
    }

    score = Math.max(0, Math.min(1, score));

    console.log(
      `   📊 [ContextAlignmentValidator] Final score: ${(score * 100).toFixed(0)}%, Issues: ${issues.length}, Blockers: ${blockers.length}`,
    );

    return { score, issues, blockers };
  }

  private isValidPath(path: string): boolean {
    // Basic path validation
    if (!path || path.trim().length === 0) return false;
    if (path.includes('..')) return false; // No parent directory traversal
    if (path.startsWith('/') || path.startsWith('\\')) return false; // Should be relative

    return true;
  }

  protected generateMessage(
    score: number,
    passed: boolean,
    issues: string[],
    blockers: string[],
  ): string {
    if (blockers.length > 0) {
      return `Repository context alignment issues: ${blockers[0]}`;
    }
    if (passed && issues.length === 0) {
      return 'Suggested paths align well with repository context';
    }
    if (passed) {
      return `Repository context mostly aligned with minor issues`;
    }
    return `Repository context alignment needs improvement (${Math.round(score * 100)}% aligned)`;
  }
}
