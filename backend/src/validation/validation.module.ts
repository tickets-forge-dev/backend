import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { MastraWorkspaceFactory } from './infrastructure/MastraWorkspaceFactory';
import { QuickPreflightValidator } from './agents/QuickPreflightValidator';
import { FindingsToQuestionsAgent } from './agents/FindingsToQuestionsAgent';

/**
 * Validation Module - Epic 7: Code-Aware Validation
 *
 * Provides:
 * - Mastra workspace management for repository analysis
 * - Quick preflight validators (fast, targeted validation)
 * - Findings generation and storage
 *
 * Performance Targets:
 * - 10-30 seconds execution time
 * - 2k-5k tokens per validation
 * - $0.01-0.05 cost per ticket
 *
 * This module runs alongside existing validation (Epic 3) and provides
 * concrete findings based on real code checks.
 */
@Module({
  imports: [SharedModule],
  providers: [
    MastraWorkspaceFactory,
    QuickPreflightValidator, // Story 7.3 ✅
    FindingsToQuestionsAgent, // Story 7.10 - HITL questions
    // TODO Story 7.4: Add SecurityFocusedValidator
    // TODO Story 7.5: Add ArchitectureFocusedValidator
  ],
  exports: [
    MastraWorkspaceFactory,
    QuickPreflightValidator,
    FindingsToQuestionsAgent,
    // TODO: Export specialized validators when implemented
  ],
})
export class ValidationModule {}
