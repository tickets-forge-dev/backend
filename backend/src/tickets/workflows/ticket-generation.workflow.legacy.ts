/**
 * Ticket Generation Workflow (Story 7.10)
 *
 * 10-step HITL workflow for generating AEC tickets with preflight validation
 * and user interaction at critical decision points.
 *
 * SUSPENSION POINTS (User Input Required):
 * - Step 4: Review critical findings before proceeding
 * - Step 9: Answer clarifying questions
 *
 * DUAL STORAGE:
 * - Workflow state: LibSQL (Mastra managed)
 * - AEC entity: Firebase/Firestore
 *
 * NOTE: Type errors suppressed pending Mastra v1.1.0 API documentation verification
 */

import { Step, Workflow } from '@mastra/core/workflows';
import { executeWithRetry } from './async-retry.utils';

// Workflow input interface
export interface TicketGenerationInput {
  aecId: string;
  workspaceId: string;
}

// Workflow state interface (shared across steps)
export interface TicketGenerationState {
  workflowRunId?: string; // Phase B Fix #6 - Workflow lock identifier
  intent?: string;
  keywords?: string[];
  type?: string;
  findings?: any[];
  repoContext?: string;
  apiContext?: string;
  acceptanceCriteria?: string[];
  assumptions?: string[];
  repoPaths?: string[];
  questions?: any[];
}

/**
 * Step 0: Initialize & Lock (Phase B Fix #6)
 * Locks the AEC to prevent concurrent edits during workflow execution
 * Validates workspace readiness before proceeding (Phase B Fix #8)
 * Phase B Fix #9: Added retry logic for transient failures
 */
const initializeAndLockStep = new Step({
  id: 'initializeAndLock',
  description: 'Lock AEC for workflow execution and validate readiness',
  execute: async ({ inputData, mastra, setState }) => {
    try {
      const aecRepository = mastra.getService('AECRepository');
      const workflowRunId = `workflow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Phase B Fix #9: Retry AEC lookup with exponential backoff
      const aecLookupResult = await executeWithRetry(
        () => aecRepository.findById(inputData.aecId),
        { stepName: 'initializeAndLock:findById', maxAttempts: 3 }
      );

      if (!aecLookupResult.success || !aecLookupResult.data) {
        throw new Error(`AEC not found after retries: ${inputData.aecId}`);
      }

      const aec = aecLookupResult.data;

      // Check if already locked by another workflow
      if (aec.isLocked) {
        throw new Error(
          `AEC is already locked by workflow: ${aec.lockedBy}. Cannot start concurrent workflow.`
        );
      }

      // Phase B Fix #8: Validate workspace readiness before proceeding
      if (aec.repositoryContext) {
        try {
          const indexQueryService = mastra.getService('IndexQueryService');
          
          // Phase B Fix #9: Retry index status check with exponential backoff
          const indexStatusResult = await executeWithRetry(
            () => indexQueryService.getIndexStatus(aec.repositoryContext.indexId),
            { stepName: 'initializeAndLock:indexStatus', maxAttempts: 3 }
          );

          if (!indexStatusResult.success || !indexStatusResult.data?.ready) {
            const message = indexStatusResult.data?.message || 'Still indexing';
            throw new Error(
              `Repository index is not ready: ${message}. ` +
              `Please wait for indexing to complete and try again.`
            );
          }

          console.log(`✅ [initializeAndLock] Repository index is ready`);
        } catch (readinessError: any) {
          // If index service unavailable, fail gracefully with helpful message
          if (readinessError.message.includes('not found')) {
            throw new Error(
              `Repository index not found (${aec.repositoryContext.indexId}). ` +
              `Please ensure the repository has been indexed in Settings.`
            );
          }
          throw readinessError;
        }
      } else {
        console.warn('[initializeAndLock] No repository context - skipping index readiness check');
      }

      // Lock and transition to GENERATING state
      aec.startGenerating(workflowRunId); // Phase B Fix #7 - State transition validation
      
      // Phase B Fix #9: Retry AEC update with exponential backoff
      const updateResult = await executeWithRetry(
        () => aecRepository.update(aec),
        { stepName: 'initializeAndLock:update', maxAttempts: 3 }
      );

      if (!updateResult.success) {
        throw updateResult.error || new Error('Failed to lock AEC after retries');
      }

      // Store workflow run ID in state for later reference
      await setState({ workflowRunId });

      console.log(`🔒 [initializeAndLock] Locked AEC ${inputData.aecId} for workflow ${workflowRunId}`);
      console.log(`📊 [initializeAndLock] AEC status transitioned to GENERATING`);

      return { locked: true, workflowRunId, readinessCheck: 'passed' };
    } catch (error) {
      console.error('[initializeAndLock] Error:', error);
      throw error;
    }
  },
});

/**
 * Step 1: Extract Intent
 * Uses LLM to extract user's intent and keywords from title/description
 * Phase B Fix #9: Added retry logic for LLM call
 */
const extractIntentStep = new Step({
  id: 'extractIntent',
  description: 'Extract user intent and keywords from ticket input',
  execute: async ({ inputData, mastra, setState }) => {
    try {
      const contentGenerator = mastra.getService('MastraContentGenerator');
      const aecRepository = mastra.getService('AECRepository');

      const aec = await aecRepository.findById(inputData.aecId);
      if (!aec) {
        throw new Error(`AEC not found: ${inputData.aecId}`);
      }

      // Phase B Fix #9: Retry LLM call with exponential backoff
      const intentResult = await executeWithRetry(
        () => contentGenerator.extractIntent({
          title: aec.title,
          description: aec.description || '',
        }),
        { stepName: 'extractIntent', maxAttempts: 3 }
      );

      if (!intentResult.success || !intentResult.data) {
        throw intentResult.error || new Error('Failed to extract intent after retries');
      }

      const result = intentResult.data;

      await setState({
        intent: result.intent,
        keywords: result.keywords,
      });

      return { intent: result.intent, keywords: result.keywords };
    } catch (error) {
      console.error('[extractIntentStep] Error:', error);
      throw error;
    }
  },
});

/**
 * Step 2: Detect Type
 * Classifies ticket as FEATURE, BUG, REFACTOR, CHORE, or SPIKE
 * Phase B Fix #9: Added retry logic for LLM call
 */
const detectTypeStep = new Step({
  id: 'detectType',
  description: 'Detect ticket type from intent',
  execute: async ({ getState, mastra, setState }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const contentGenerator = mastra.getService('MastraContentGenerator');

      // Phase B Fix #9: Retry LLM call with exponential backoff
      const typeResult = await executeWithRetry(
        () => contentGenerator.detectType(state.intent || ''),
        { stepName: 'detectType', maxAttempts: 3 }
      );

      if (!typeResult.success || !typeResult.data) {
        throw typeResult.error || new Error('Failed to detect type after retries');
      }

      const result = typeResult.data;

      await setState({ type: result.type });

      return { type: result.type };
    } catch (error) {
      console.error('[detectTypeStep] Error:', error);
      throw error;
    }
  },
});

/**
 * Step 3: Preflight Validation
 * Runs code-aware validation using QuickPreflightValidator
 * Requires: Repository context with indexId
 * Graceful degradation: If workspace not indexed, returns INFO finding
 */
const preflightValidationStep = new Step({
  id: 'preflightValidation',
  description: 'Run code-aware preflight validation',
  execute: async ({ inputData, mastra, setState }) => {
    try {
      const workspaceFactory = mastra.getService('MastraWorkspaceFactory');
      const aecRepository = mastra.getService('AECRepository');
      const validator = mastra.getService('QuickPreflightValidator');

      // Get AEC to extract repository context
      const aec = await aecRepository.findById(inputData.aecId);
      if (!aec) {
        throw new Error(`AEC not found: ${inputData.aecId}`);
      }

      // Check if repository context exists
      if (!aec.repositoryContext) {
        console.warn('[preflightValidationStep] No repository context, skipping validation');
        await setState({ findings: [] });
        return { findings: [], hasCritical: false };
      }

      // Get workspace with repository context
      const workspace = await workspaceFactory.getOrCreateWorkspace(
        inputData.workspaceId,
        aec.repositoryContext.repositoryFullName,
        aec.repositoryContext.indexId,
      );

      const findings = await validator.validate(aec, workspace);
      await setState({ findings });
      const hasCritical = findings.some((f: any) => f.severity === 'critical');

      return { findings, hasCritical };
    } catch (error) {
      console.error('[preflightValidationStep] Error:', error);
      // Graceful degradation - continue workflow even if validation fails
      await setState({ findings: [] });
      return { findings: [], hasCritical: false };
    }
  },
});

/**
 * Step 4: Review Findings (SUSPENSION POINT)
 * If critical findings exist, workflow suspends for user review
 * User can: proceed, edit, or cancel
 * Phase B Fix #9: Added retry logic for AEC persistence
 */
const reviewFindingsStep = new Step({
  id: 'reviewFindings',
  description: 'Review critical findings (suspends if critical issues found)',
  execute: async ({ inputData, getState, mastra }) => {
    const state = await getState<TicketGenerationState>();
    const findings = state.findings || [];
    const hasCritical = findings.some((f: any) => f.severity === 'critical');

    if (hasCritical) {
      // Phase B Fix #7: Transition to SUSPENDED_FINDINGS state
      try {
        const aecRepository = mastra.getService('AECRepository');
        const aec = await aecRepository.findById(inputData.aecId);
        if (aec) {
          aec.suspendForFindingsReview(findings);
          
          // Phase B Fix #9: Retry AEC update with exponential backoff
          const updateResult = await executeWithRetry(
            () => aecRepository.update(aec),
            { stepName: 'reviewFindings:update', maxAttempts: 3 }
          );

          if (updateResult.success) {
            console.log(`⏸️ [reviewFindings] AEC transitioned to SUSPENDED_FINDINGS`);
          } else {
            console.error('[reviewFindings] Failed to update AEC after retries');
          }
        }
      } catch (error) {
        console.error('[reviewFindings] Failed to update AEC status:', error);
        // Continue anyway - state transition is advisory
      }

      // Workflow will suspend here - user must take action
      // Frontend shows findings and action buttons
      return {
        action: 'suspend',
        reason: 'critical_findings',
        findings,
      };
    }

    return { action: 'proceed', findings };
  },
});

/**
 * Step 5: Gather Repository Context
 * Queries codebase using IndexQueryService for relevant files/patterns
 * Requires: Repository to be indexed
 * Graceful degradation: Returns empty context if service unavailable
 * Phase B Fix #8: Validates workspace readiness before querying
 * Phase B Fix #9: Added retry logic for index queries
 */
const gatherRepoContextStep = new Step({
  id: 'gatherRepoContext',
  description: 'Query repository for relevant code context',
  execute: async ({ inputData, getState, mastra, setState }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const indexQueryService = mastra.getService('IndexQueryService');
      const aecRepository = mastra.getService('AECRepository');

      const aec = await aecRepository.findById(inputData.aecId);
      if (!aec || !aec.repositoryContext) {
        console.warn('[gatherRepoContextStep] No repository context');
        await setState({ repoContext: '' });
        return { repoContext: '' };
      }

      // Phase B Fix #8: Validate workspace is still indexed before querying
      // Phase B Fix #9: Retry index status check with exponential backoff
      const indexStatusResult = await executeWithRetry(
        () => indexQueryService.getIndexStatus(aec.repositoryContext.indexId),
        { stepName: 'gatherRepoContext:indexStatus', maxAttempts: 3 }
      );

      if (!indexStatusResult.success || !indexStatusResult.data?.ready) {
        const message = indexStatusResult.data?.message || 'Index not ready';
        console.warn(
          `[gatherRepoContextStep] Index not ready (${message}). ` +
          `Skipping code context gathering.`
        );
        await setState({ repoContext: '' });
        return { repoContext: '' };
      }

      const keywords = state.keywords || [];
      const query = keywords.join(' ') || state.intent || aec.title;

      // Phase B Fix #9: Retry index query with exponential backoff
      const queryResult = await executeWithRetry(
        () => indexQueryService.query({
          indexId: aec.repositoryContext.indexId,
          query,
          limit: 10,
        }),
        { stepName: 'gatherRepoContext:query', maxAttempts: 3 }
      );

      if (!queryResult.success || !queryResult.data) {
        console.warn('[gatherRepoContextStep] Failed to query index after retries');
        await setState({ repoContext: '' });
        return { repoContext: '' };
      }

      const results = queryResult.data;
      const repoContext = results
        .map((r: any) => `${r.path}:\n${r.snippet}`)
        .join('\n\n');

      await setState({ repoContext });

      return { repoContext };
    } catch (error) {
      console.error('[gatherRepoContextStep] Error:', error);
      // Graceful degradation
      await setState({ repoContext: '' });
      return { repoContext: '' };
    }
  },
});

/**
 * Step 6: Gather API Context
 * Fetches API snapshots for external dependencies
 * Optional: Only runs if ticket mentions external APIs
 */
const gatherApiContextStep = new Step({
  id: 'gatherApiContext',
  description: 'Gather API context for external dependencies',
  execute: async ({ setState }) => {
    // TODO: Implement API context gathering (Epic 7.4)
    // For now, return empty context
    await setState({ apiContext: '' });
    return { apiContext: '' };
  },
});

/**
 * Step 7: Generate Draft Content
 * Uses LLM to generate acceptance criteria, assumptions, and repo paths
 * Saves to workflow state for finalization step
 * Phase B Fix #9: Added retry logic for LLM call
 */
const draftTicketStep = new Step({
  id: 'draftTicket',
  description: 'Generate acceptance criteria, assumptions, and repo paths',
  execute: async ({ getState, mastra, setState }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const contentGenerator = mastra.getService('MastraContentGenerator');

      // Phase B Fix #9: Retry LLM call with exponential backoff
      const draftResult = await executeWithRetry(
        () => contentGenerator.generateDraft({
          intent: state.intent || '',
          type: state.type || 'FEATURE',
          repoContext: state.repoContext || '',
          apiContext: state.apiContext || '',
        }),
        { stepName: 'draftTicket', maxAttempts: 3 }
      );

      if (!draftResult.success || !draftResult.data) {
        throw draftResult.error || new Error('Failed to generate draft after retries');
      }

      const result = draftResult.data;

      // Save to state for finalization step
      await setState({
        acceptanceCriteria: result.acceptanceCriteria,
        assumptions: result.assumptions,
        repoPaths: result.repoPaths,
      });

      return {
        acceptanceCriteria: result.acceptanceCriteria,
        assumptions: result.assumptions,
        repoPaths: result.repoPaths,
      };
    } catch (error) {
      console.error('[draftTicketStep] Error:', error);
      throw error;
    }
  },
});

/**
 * Step 8: Generate Questions
 * Identifies missing information and generates clarifying questions
 * Uses FindingsToQuestionsAgent if critical findings exist
 * Phase B Fix #9: Added retry logic for agent call
 */
const generateQuestionsStep = new Step({
  id: 'generateQuestions',
  description: 'Generate clarifying questions from findings and draft',
  execute: async ({ getState, mastra, setState }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const findingsAgent = mastra.getService('FindingsToQuestionsAgent');

      // Phase B Fix #9: Retry agent call with exponential backoff
      const questionsResult = await executeWithRetry(
        () => findingsAgent.generateQuestions({
          findings: state.findings || [],
          acceptanceCriteria: state.acceptanceCriteria || [],
          assumptions: state.assumptions || [],
        }),
        { stepName: 'generateQuestions', maxAttempts: 3 }
      );

      if (!questionsResult.success || !questionsResult.data) {
        console.warn('[generateQuestionsStep] Failed to generate questions after retries, proceeding without questions');
        await setState({ questions: [] });
        return { questions: [], hasQuestions: false };
      }

      const questions = questionsResult.data;

      await setState({ questions });

      return { questions, hasQuestions: questions.length > 0 };
    } catch (error) {
      console.error('[generateQuestionsStep] Error:', error);
      // Graceful degradation - proceed without questions
      await setState({ questions: [] });
      return { questions: [], hasQuestions: false };
    }
  },
});

/**
 * Step 9: Ask Questions (SUSPENSION POINT)
 * If questions exist, workflow suspends for user answers
 * User provides answers, workflow resumes with refinement
 * Phase B Fix #9: Added retry logic for AEC persistence
 */
const askQuestionsStep = new Step({
  id: 'askQuestions',
  description: 'Ask clarifying questions (suspends if questions exist)',
  execute: async ({ inputData, getState, mastra }) => {
    const state = await getState<TicketGenerationState>();
    const questions = state.questions || [];

    if (questions.length > 0) {
      // Phase B Fix #7: Transition to SUSPENDED_QUESTIONS state
      try {
        const aecRepository = mastra.getService('AECRepository');
        const aec = await aecRepository.findById(inputData.aecId);
        if (aec) {
          aec.suspendForQuestions(questions);
          
          // Phase B Fix #9: Retry AEC update with exponential backoff
          const updateResult = await executeWithRetry(
            () => aecRepository.update(aec),
            { stepName: 'askQuestions:update', maxAttempts: 3 }
          );

          if (updateResult.success) {
            console.log(`⏸️ [askQuestions] AEC transitioned to SUSPENDED_QUESTIONS`);
          } else {
            console.error('[askQuestions] Failed to update AEC after retries');
          }
        }
      } catch (error) {
        console.error('[askQuestions] Failed to update AEC status:', error);
        // Continue anyway - state transition is advisory
      }

      // Workflow suspends here - user must answer questions
      return {
        action: 'suspend',
        reason: 'questions',
        questions,
      };
    }

    return { action: 'proceed', questions: [] };
  },
});

/**
 * Step 10: Refine Draft (Optional)
 * Refines acceptance criteria based on user answers
 * Only runs if user provided answers to questions
 */
const refineDraftStep = new Step({
  id: 'refineDraft',
  description: 'Refine draft based on user answers (optional)',
  execute: async ({ getState, setState }) => {
    const state = await getState<TicketGenerationState>();

    // TODO: Implement refinement logic using user answers
    // For now, pass through existing state

    return {
      acceptanceCriteria: state.acceptanceCriteria || [],
      assumptions: state.assumptions || [],
      repoPaths: state.repoPaths || [],
    };
  },
});

/**
 * Step 11: Finalize (NEW - Phase B Fix)
 * Persists all workflow outputs to AEC entity in Firestore
 * Transitions to VALIDATED state
 * Unlocks the AEC to allow further edits
 * This ensures generated content is saved permanently
 * Phase B Fix #9: Added retry logic for Firestore persistence
 */
const finalizeStep = new Step({
  id: 'finalize',
  description: 'Save workflow outputs to AEC entity, transition to VALIDATED, and unlock',
  execute: async ({ inputData, getState, mastra }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const aecRepository = mastra.getService('AECRepository');

      const aec = await aecRepository.findById(inputData.aecId);
      if (!aec) {
        throw new Error(`AEC not found: ${inputData.aecId}`);
      }

      // Update AEC with workflow outputs
      aec.updateContent({
        type: state.type || null,
        acceptanceCriteria: state.acceptanceCriteria || [],
        assumptions: state.assumptions || [],
        repoPaths: state.repoPaths || [],
        preImplementationFindings: state.findings || [],
      });

      // Phase B Fix #7: Validate and transition to VALIDATED state
      try {
        aec.validate([]); // Pass empty validation results (preflight already done)
        console.log(`📊 [finalizeStep] AEC transitioned to VALIDATED`);
      } catch (stateError) {
        console.warn('[finalizeStep] State transition validation failed:', stateError.message);
        // If state transition fails (e.g., already in terminal state), continue anyway
      }

      // Unlock the AEC (Phase B Fix #6)
      aec.unlock();

      // Phase B Fix #9: Retry Firestore persistence with exponential backoff
      const persistResult = await executeWithRetry(
        () => aecRepository.update(aec),
        { stepName: 'finalizeStep:persist', maxAttempts: 3 }
      );

      if (!persistResult.success) {
        throw persistResult.error || new Error('Failed to persist AEC after retries');
      }

      console.log(`✅ [finalizeStep] Saved workflow outputs to AEC ${inputData.aecId}`);
      console.log(`🔓 [finalizeStep] Unlocked AEC ${inputData.aecId}`);

      return { success: true, unlocked: true };
    } catch (error) {
      console.error('[finalizeStep] Error:', error);
      
      // Attempt to mark as failed and unlock (Phase B Fix #7 + #6)
      try {
        const aecRepository = mastra.getService('AECRepository');
        const aec = await aecRepository.findById(inputData.aecId);
        if (aec) {
          // Transition to FAILED state
          try {
            aec.markAsFailed(error.message || 'Unknown error in finalize step');
            console.log(`❌ [finalizeStep] AEC marked as FAILED`);
          } catch (stateError) {
            console.warn('[finalizeStep] Failed to mark as FAILED:', stateError.message);
          }

          // Force unlock
          if (aec.isLocked) {
            aec.forceUnlock();
            console.log(`⚠️ [finalizeStep] Force-unlocked AEC after error: ${inputData.aecId}`);
          }

          // Phase B Fix #9: Retry cleanup with exponential backoff
          const cleanupResult = await executeWithRetry(
            () => aecRepository.update(aec),
            { stepName: 'finalizeStep:cleanup', maxAttempts: 3 }
          );

          if (!cleanupResult.success) {
            console.error('[finalizeStep] Failed to clean up after error:', cleanupResult.error?.message);
          }
        }
      } catch (cleanupError) {
        console.error('[finalizeStep] Failed to clean up after error:', cleanupError);
      }

      throw error;
    }
  },
});

/**
 * Ticket Generation Workflow Definition
 *
 * Flow:
 * 0. Initialize & Lock (lock AEC for exclusive access)
 * 1. Extract Intent → 2. Detect Type → 3. Preflight Validation
 * 4. Review Findings (suspend if critical) → 5. Gather Repo Context
 * 6. Gather API Context → 7. Draft Ticket → 8. Generate Questions
 * 9. Ask Questions (suspend if questions) → 10. Refine Draft
 * 11. Finalize (save to AEC, unlock)
 */
export const ticketGenerationWorkflow = new Workflow({
  name: 'ticket-generation',
  triggerSchema: {} as TicketGenerationInput,
})
  .step(initializeAndLockStep)
  .step(extractIntentStep)
  .step(detectTypeStep)
  .step(preflightValidationStep)
  .step(reviewFindingsStep)
  .step(gatherRepoContextStep)
  .step(gatherApiContextStep)
  .step(draftTicketStep)
  .step(generateQuestionsStep)
  .step(askQuestionsStep)
  .step(refineDraftStep)
  .step(finalizeStep)
  .commit();
