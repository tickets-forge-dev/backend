import { Module } from '@nestjs/common';
import { MastraWorkspaceFactory } from './infrastructure/MastraWorkspaceFactory';

/**
 * Validation Module - Epic 7: Code-Aware Validation
 *
 * Provides:
 * - Mastra workspace management for repository analysis
 * - Analysis agents (Stories 7.3-7.5)
 * - Findings generation and storage
 *
 * This module runs alongside existing validation (Epic 3) and will
 * eventually replace abstract scoring with concrete findings.
 */
@Module({
  providers: [
    MastraWorkspaceFactory,
    // TODO Story 7.3: Add PreImplementationAgent
    // TODO Story 7.4: Add SecurityAnalysisAgent
    // TODO Story 7.5: Add ArchitectureValidationAgent
  ],
  exports: [
    MastraWorkspaceFactory,
    // TODO: Export agents when implemented
  ],
})
export class ValidationModule {}
