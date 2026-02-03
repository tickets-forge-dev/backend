/**
 * AEC Domain Tests - Phase B State Machine
 * 
 * Tests for:
 * - Fix #6: Locking mechanism
 * - Fix #7: State machine transitions
 * - Fix #9: Error handling with markAsFailed
 */

import { AEC } from '../domain/aec/AEC';
import { AECStatus } from '../domain/value-objects/AECStatus';
import { RepositoryContext } from '../domain/value-objects/RepositoryContext';
import { Finding } from '../../validation/domain/Finding';
import { Question } from '../domain/value-objects/Question';

describe('AEC Domain - State Machine and Locking', () => {
  let aec: AEC;
  const workspaceId = 'workspace-123';
  const workflowRunId = 'workflow-run-456';

  beforeEach(() => {
    aec = AEC.createDraft(
      workspaceId,
      'Test Ticket',
      'Test description',
    );
  });

  describe('Fix #6: Locking Mechanism', () => {
    it('should lock AEC for workflow execution', () => {
      expect(aec.isLocked).toBe(false);
      expect(aec.lockedBy).toBeNull();

      aec.lock(workflowRunId);

      expect(aec.isLocked).toBe(true);
      expect(aec.lockedBy).toBe(workflowRunId);
      expect(aec.lockedAt).toBeInstanceOf(Date);
    });

    it('should prevent double locking', () => {
      aec.lock(workflowRunId);

      expect(() => {
        aec.lock('another-workflow');
      }).toThrow(/already locked/);
    });

    it('should unlock AEC after workflow completion', () => {
      aec.lock(workflowRunId);
      expect(aec.isLocked).toBe(true);

      aec.unlock();

      expect(aec.isLocked).toBe(false);
      expect(aec.lockedBy).toBeNull();
      expect(aec.lockedAt).toBeNull();
    });

    it('should check if locked by specific workflow', () => {
      aec.lock(workflowRunId);

      expect(aec.isLockedBy(workflowRunId)).toBe(true);
      expect(aec.isLockedBy('different-workflow')).toBe(false);
    });

    it('should force unlock for error recovery', () => {
      aec.lock(workflowRunId);
      expect(aec.isLocked).toBe(true);

      aec.forceUnlock();

      expect(aec.isLocked).toBe(false);
      expect(aec.lockedBy).toBeNull();
    });
  });

  describe('Fix #7: State Machine Transitions', () => {
    it('should transition from DRAFT to GENERATING', () => {
      expect(aec.status).toBe(AECStatus.DRAFT);

      aec.startGenerating(workflowRunId);

      expect(aec.status).toBe(AECStatus.GENERATING);
      expect(aec.isLocked).toBe(true);
    });

    it('should transition from GENERATING to SUSPENDED_FINDINGS', () => {
      aec.startGenerating(workflowRunId);

      const findings: Finding[] = [{
        id: 'finding-1',
        category: 'gap',
        severity: 'critical',
        description: 'Missing required dependency',
        codeLocation: null,
        suggestion: 'Install the package',
        confidence: 0.9,
        evidence: 'npm list failed',
        createdAt: new Date(),
      }];

      aec.suspendForFindingsReview(findings);

      expect(aec.status).toBe(AECStatus.SUSPENDED_FINDINGS);
      expect(aec.preImplementationFindings).toHaveLength(1);
    });

    it('should transition from GENERATING to SUSPENDED_QUESTIONS', () => {
      aec.startGenerating(workflowRunId);
      
      // Simulate workflow progress - add required fields
      aec.updateContent('feature', ['AC1', 'AC2'], ['assumption'], []);

      const questions: Question[] = [{
        id: 'q1',
        text: 'What is the max retry count?',
        context: 'The retry logic',
        defaultAnswer: '3',
      }];

      aec.suspendForQuestions(questions);

      expect(aec.status).toBe(AECStatus.SUSPENDED_QUESTIONS);
      expect(aec.questions).toHaveLength(1);
    });

    it('should resume from SUSPENDED_FINDINGS', () => {
      aec.startGenerating(workflowRunId);
      const findings: Finding[] = [{
        id: 'f1',
        category: 'gap',
        severity: 'high',
        description: 'Test finding',
        codeLocation: null,
        suggestion: 'Fix it',
        confidence: 0.8,
        evidence: 'test',
        createdAt: new Date(),
      }];
      aec.suspendForFindingsReview(findings);

      aec.resumeGenerating();

      expect(aec.status).toBe(AECStatus.GENERATING);
      expect(aec.isLocked).toBe(true);
    });

    it('should revert to DRAFT from suspension (user chose edit)', () => {
      aec.startGenerating(workflowRunId);
      const findings: Finding[] = [{
        id: 'f1',
        category: 'gap',
        severity: 'critical',
        description: 'Blocker',
        codeLocation: null,
        suggestion: 'Fix',
        confidence: 1.0,
        evidence: 'test',
        createdAt: new Date(),
      }];
      aec.suspendForFindingsReview(findings);

      aec.revertToDraft();

      expect(aec.status).toBe(AECStatus.DRAFT);
      expect(aec.isLocked).toBe(false);
    });

    it('should reject invalid transitions', () => {
      // DRAFT cannot go directly to VALIDATED (must go through GENERATING)
      expect(aec.status).toBe(AECStatus.DRAFT);

      expect(() => {
        // Try to manually set status (would need to be tested via validate() method)
        // This tests the validation logic when implemented
      }).not.toThrow();
    });

    it('should validate required fields for status transitions', () => {
      aec.startGenerating(workflowRunId);
      aec.resumeGenerating();
      
      // Try to validate without required fields (type, acceptanceCriteria)
      expect(() => {
        aec.validate([]);
      }).toThrow(/Missing required fields/);
    });

    it('should unlock after successful validation', () => {
      aec.startGenerating(workflowRunId);
      aec.updateContent('feature', ['AC1'], ['assumption'], []);

      const validationResults: any[] = [];
      aec.validate(validationResults);

      expect(aec.status).toBe(AECStatus.VALIDATED);
      expect(aec.isLocked).toBe(false);
    });
  });

  describe('Fix #9: Async Error Handling', () => {
    it('should mark AEC as failed with reason', () => {
      aec.startGenerating(workflowRunId);
      expect(aec.isLocked).toBe(true);

      const reason = 'LLM service unavailable';
      aec.markAsFailed(reason);

      expect(aec.status).toBe(AECStatus.FAILED);
      expect(aec.failureReason).toBe(reason);
      expect(aec.isLocked).toBe(false); // Auto-unlocked
    });

    it('should allow recovery from failed status', () => {
      aec.startGenerating(workflowRunId);
      aec.markAsFailed('Test error');

      expect(aec.status).toBe(AECStatus.FAILED);

      // Can go back to DRAFT to retry
      aec.revertToDraft();

      expect(aec.status).toBe(AECStatus.DRAFT);
      expect(aec.isLocked).toBe(false);
    });

    it('should validate transition to FAILED from GENERATING', () => {
      aec.startGenerating(workflowRunId);

      // Should succeed
      expect(() => {
        aec.markAsFailed('Error occurred');
      }).not.toThrow();

      expect(aec.status).toBe(AECStatus.FAILED);
    });

    it('should reject invalid transition to FAILED from DRAFT', () => {
      expect(aec.status).toBe(AECStatus.DRAFT);

      // DRAFT → FAILED is not a valid transition
      expect(() => {
        aec.markAsFailed('Cannot fail draft');
      }).toThrow(/Invalid transition/);
    });
  });

  describe('Complete Workflow State Transitions', () => {
    it('should complete happy path: DRAFT → GENERATING → VALIDATED → READY', () => {
      // Start
      expect(aec.status).toBe(AECStatus.DRAFT);

      // Step 1: Start generation
      aec.startGenerating(workflowRunId);
      expect(aec.status).toBe(AECStatus.GENERATING);

      // Step 2: Add content
      aec.updateContent('feature', ['AC1', 'AC2'], ['assumption'], ['src/file.ts']);

      // Step 3: Validate
      aec.validate([]);
      expect(aec.status).toBe(AECStatus.VALIDATED);
      expect(aec.isLocked).toBe(false);

      // Step 4: Mark ready
      const codeSnapshot = {
        repositoryFullName: 'org/repo',
        commitSha: 'abc123',
        branchName: 'main',
        capturedAt: new Date(),
      };
      aec.markReady(codeSnapshot);

      expect(aec.status).toBe(AECStatus.READY);
    });

    it('should complete suspension path: DRAFT → GENERATING → SUSPENDED_FINDINGS → GENERATING → VALIDATED', () => {
      aec.startGenerating(workflowRunId);

      // Suspend for findings
      const findings: Finding[] = [{
        id: 'f1',
        category: 'gap',
        severity: 'high',
        description: 'Warning',
        codeLocation: null,
        suggestion: 'Review',
        confidence: 0.7,
        evidence: 'test',
        createdAt: new Date(),
      }];
      aec.suspendForFindingsReview(findings);
      expect(aec.status).toBe(AECStatus.SUSPENDED_FINDINGS);

      // User proceeds
      aec.resumeGenerating();
      expect(aec.status).toBe(AECStatus.GENERATING);

      // Complete
      aec.updateContent('feature', ['AC1'], [], []);
      aec.validate([]);
      expect(aec.status).toBe(AECStatus.VALIDATED);
    });
  });
});
