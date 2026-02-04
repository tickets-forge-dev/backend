/**
 * Ticket Generation Workflow (Story 7.10)
 *
 * 12-step HITL workflow for generating AEC tickets with preflight validation
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
 * Mastra 1.0.0 API - Uses createStep/createWorkflow with Zod schemas
 */

import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { executeWithRetry } from './async-retry.utils';

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

// Workflow input schema
export const workflowInputSchema = z.object({
  aecId: z.string(),
  workspaceId: z.string(),
});

export type TicketGenerationInput = z.infer<typeof workflowInputSchema>;

// Common schemas
const findingSchema = z.object({
  id: z.string().optional(),
  severity: z.enum(['critical', 'warning', 'info']),
  message: z.string(),
  context: z.any().optional(),
});

const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['text', 'textarea', 'radio', 'checkbox']).optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

// Workflow state schema
const workflowStateSchema = z.object({
  workflowRunId: z.string().optional(),
  intent: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  type: z.string().optional(),
  findings: z.array(findingSchema).optional(),
  repoContext: z.string().optional(),
  apiContext: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
  repoPaths: z.array(z.string()).optional(),
  questions: z.array(questionSchema).optional(),
  answers: z.record(z.string()).optional(),
});

export type TicketGenerationState = z.infer<typeof workflowStateSchema>;

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

/**
 * Step 0: Initialize & Lock
 * Locks the AEC to prevent concurrent edits during workflow execution
 */
const initializeAndLockStep = createStep({
  id: 'initializeAndLock',
  description: 'Lock AEC for workflow execution and validate readiness',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    locked: z.boolean(),
    workflowRunId: z.string(),
    readinessCheck: z.string(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, mastra, setState }) => {
    const aecRepository = mastra.getService('AECRepository') as any;
    const workflowRunId = `workflow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const aecLookupResult = await executeWithRetry(
      () => aecRepository.findById(inputData.aecId),
      { stepName: 'initializeAndLock:findById', maxAttempts: 3 }
    );

    if (!aecLookupResult.success || !aecLookupResult.data) {
      throw new Error(`AEC not found after retries: ${inputData.aecId}`);
    }

    const aec = aecLookupResult.data;

    if (aec.isLocked) {
      throw new Error(
        `AEC is already locked by workflow: ${aec.lockedBy}. Cannot start concurrent workflow.`
      );
    }

    // Validate workspace readiness if repository context exists
    if (aec.repositoryContext) {
      const indexQueryService = mastra.getService('IndexQueryService') as any;
      const indexStatusResult = await executeWithRetry(
        () => indexQueryService.getIndexStatus(aec.repositoryContext.indexId),
        { stepName: 'initializeAndLock:indexStatus', maxAttempts: 3 }
      );

      if (!indexStatusResult.success || !indexStatusResult.data?.ready) {
        const message = indexStatusResult.data?.message || 'Still indexing';
        throw new Error(
          `Repository index is not ready: ${message}. Please wait for indexing to complete.`
        );
      }
      console.log(`✅ [initializeAndLock] Repository index is ready`);
    }

    // Lock and transition to GENERATING state
    aec.startGenerating(workflowRunId);

    const updateResult = await executeWithRetry(
      () => aecRepository.update(aec),
      { stepName: 'initializeAndLock:update', maxAttempts: 3 }
    );

    if (!updateResult.success) {
      throw updateResult.error || new Error('Failed to lock AEC after retries');
    }

    await setState({ workflowRunId });
    console.log(`🔒 [initializeAndLock] Locked AEC ${inputData.aecId} for workflow ${workflowRunId}`);

    return { locked: true, workflowRunId, readinessCheck: 'passed' };
  },
});

/**
 * Step 1: Extract Intent
 * Uses LLM to extract user's intent and keywords from title/description
 */
const extractIntentStep = createStep({
  id: 'extractIntent',
  description: 'Extract user intent and keywords from ticket input',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    intent: z.string(),
    keywords: z.array(z.string()),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, mastra, setState }) => {
    const contentGenerator = mastra.getService('MastraContentGenerator') as any;
    const aecRepository = mastra.getService('AECRepository') as any;

    const aec = await aecRepository.findById(inputData.aecId);
    if (!aec) {
      throw new Error(`AEC not found: ${inputData.aecId}`);
    }

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
    await setState({ intent: result.intent, keywords: result.keywords });

    return { intent: result.intent, keywords: result.keywords };
  },
});

/**
 * Step 2: Detect Type
 * Classifies ticket as FEATURE, BUG, REFACTOR, CHORE, or SPIKE
 */
const detectTypeStep = createStep({
  id: 'detectType',
  description: 'Detect ticket type from intent',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    type: z.string(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const contentGenerator = mastra.getService('MastraContentGenerator') as any;

    const typeResult = await executeWithRetry(
      () => contentGenerator.detectType(state.intent || ''),
      { stepName: 'detectType', maxAttempts: 3 }
    );

    if (!typeResult.success || !typeResult.data) {
      throw typeResult.error || new Error('Failed to detect type after retries');
    }

    await setState({ type: typeResult.data.type });
    return { type: typeResult.data.type };
  },
});

/**
 * Step 3: Preflight Validation
 * Runs code-aware validation using QuickPreflightValidator
 */
const preflightValidationStep = createStep({
  id: 'preflightValidation',
  description: 'Run code-aware preflight validation',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    findings: z.array(findingSchema),
    hasCritical: z.boolean(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, mastra, setState }) => {
    const workspaceFactory = mastra.getService('MastraWorkspaceFactory') as any;
    const aecRepository = mastra.getService('AECRepository') as any;
    const validator = mastra.getService('QuickPreflightValidator') as any;

    const aec = await aecRepository.findById(inputData.aecId);
    if (!aec) {
      throw new Error(`AEC not found: ${inputData.aecId}`);
    }

    if (!aec.repositoryContext) {
      console.warn('[preflightValidation] No repository context, skipping validation');
      await setState({ findings: [] });
      return { findings: [], hasCritical: false };
    }

    const workspace = await workspaceFactory.getOrCreateWorkspace(
      inputData.workspaceId,
      aec.repositoryContext.repositoryFullName,
      aec.repositoryContext.indexId
    );

    const findings = await validator.validate(aec, workspace);
    await setState({ findings });
    const hasCritical = findings.some((f: any) => f.severity === 'critical');

    return { findings, hasCritical };
  },
});

/**
 * Step 4: Review Findings (SUSPENSION POINT)
 * If critical findings exist, workflow suspends for user review
 */
const reviewFindingsStep = createStep({
  id: 'reviewFindings',
  description: 'Review critical findings (suspends if critical issues found)',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    action: z.enum(['proceed', 'suspended']),
    findings: z.array(findingSchema),
  }),
  suspendSchema: z.object({
    reason: z.literal('critical_findings'),
    findings: z.array(findingSchema),
  }),
  resumeSchema: z.object({
    action: z.enum(['proceed', 'cancel', 'edit']),
    modifications: z.record(z.any()).optional(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, state, mastra, suspend, resumeData }) => {
    const findings = state.findings || [];
    const hasCritical = findings.some((f: any) => f.severity === 'critical');

    // If resuming, check the user's decision
    if (resumeData) {
      if (resumeData.action === 'cancel') {
        throw new Error('User cancelled workflow due to critical findings');
      }
      // User chose to proceed or edit - continue
      console.log(`✅ [reviewFindings] User chose to ${resumeData.action}`);
      return { action: 'proceed' as const, findings };
    }

    if (hasCritical) {
      // Update AEC state to suspended
      const aecRepository = mastra.getService('AECRepository') as any;
      const aec = await aecRepository.findById(inputData.aecId);
      if (aec) {
        aec.suspendForFindingsReview(findings);
        await executeWithRetry(
          () => aecRepository.update(aec),
          { stepName: 'reviewFindings:update', maxAttempts: 3 }
        );
        console.log(`⏸️ [reviewFindings] AEC transitioned to SUSPENDED_FINDINGS`);
      }

      // Suspend workflow for user review
      return await suspend({
        reason: 'critical_findings' as const,
        findings,
      });
    }

    return { action: 'proceed' as const, findings };
  },
});

/**
 * Step 5: Gather Repository Context
 * Queries codebase using IndexQueryService for relevant files/patterns
 */
const gatherRepoContextStep = createStep({
  id: 'gatherRepoContext',
  description: 'Query repository for relevant code context',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    repoContext: z.string(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, state, mastra, setState }) => {
    const indexQueryService = mastra.getService('IndexQueryService') as any;
    const aecRepository = mastra.getService('AECRepository') as any;

    const aec = await aecRepository.findById(inputData.aecId);
    if (!aec || !aec.repositoryContext) {
      console.warn('[gatherRepoContext] No repository context');
      await setState({ repoContext: '' });
      return { repoContext: '' };
    }

    const indexStatusResult = await executeWithRetry(
      () => indexQueryService.getIndexStatus(aec.repositoryContext.indexId),
      { stepName: 'gatherRepoContext:indexStatus', maxAttempts: 3 }
    );

    if (!indexStatusResult.success || !indexStatusResult.data?.ready) {
      console.warn('[gatherRepoContext] Index not ready, skipping');
      await setState({ repoContext: '' });
      return { repoContext: '' };
    }

    const keywords = state.keywords || [];
    const query = keywords.join(' ') || state.intent || aec.title;

    const queryResult = await executeWithRetry(
      () => indexQueryService.query({
        indexId: aec.repositoryContext.indexId,
        query,
        limit: 10,
      }),
      { stepName: 'gatherRepoContext:query', maxAttempts: 3 }
    );

    if (!queryResult.success || !queryResult.data) {
      console.warn('[gatherRepoContext] Failed to query index');
      await setState({ repoContext: '' });
      return { repoContext: '' };
    }

    const repoContext = queryResult.data
      .map((r: any) => `${r.path}:\n${r.snippet}`)
      .join('\n\n');

    await setState({ repoContext });
    return { repoContext };
  },
});

/**
 * Step 6: Gather API Context
 * Fetches API snapshots for external dependencies
 */
const gatherApiContextStep = createStep({
  id: 'gatherApiContext',
  description: 'Gather API context for external dependencies',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    apiContext: z.string(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ setState }) => {
    // TODO: Implement API context gathering (Epic 7.4)
    await setState({ apiContext: '' });
    return { apiContext: '' };
  },
});

/**
 * Step 7: Generate Draft Content
 * Uses LLM to generate acceptance criteria, assumptions, and repo paths
 */
const draftTicketStep = createStep({
  id: 'draftTicket',
  description: 'Generate acceptance criteria, assumptions, and repo paths',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    acceptanceCriteria: z.array(z.string()),
    assumptions: z.array(z.string()),
    repoPaths: z.array(z.string()),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const contentGenerator = mastra.getService('MastraContentGenerator') as any;

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
  },
});

/**
 * Step 8: Generate Questions
 * Identifies missing information and generates clarifying questions
 */
const generateQuestionsStep = createStep({
  id: 'generateQuestions',
  description: 'Generate clarifying questions from findings and draft',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    questions: z.array(questionSchema),
    hasQuestions: z.boolean(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const findingsAgent = mastra.getService('FindingsToQuestionsAgent') as any;

    const questionsResult = await executeWithRetry(
      () => findingsAgent.generateQuestions({
        findings: state.findings || [],
        acceptanceCriteria: state.acceptanceCriteria || [],
        assumptions: state.assumptions || [],
      }),
      { stepName: 'generateQuestions', maxAttempts: 3 }
    );

    if (!questionsResult.success || !questionsResult.data) {
      console.warn('[generateQuestions] Failed to generate questions, proceeding without');
      await setState({ questions: [] });
      return { questions: [], hasQuestions: false };
    }

    const questions = questionsResult.data;
    await setState({ questions });

    return { questions, hasQuestions: questions.length > 0 };
  },
});

/**
 * Step 9: Ask Questions (SUSPENSION POINT)
 * If questions exist, workflow suspends for user answers
 */
const askQuestionsStep = createStep({
  id: 'askQuestions',
  description: 'Ask clarifying questions (suspends if questions exist)',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    action: z.enum(['proceed', 'suspended']),
    questions: z.array(questionSchema),
  }),
  suspendSchema: z.object({
    reason: z.literal('questions'),
    questions: z.array(questionSchema),
    draft: z.object({
      acceptanceCriteria: z.array(z.string()),
      assumptions: z.array(z.string()),
      repoPaths: z.array(z.string()),
    }).optional(),
  }),
  resumeSchema: z.object({
    action: z.enum(['submit', 'skip']),
    answers: z.record(z.string()).optional(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, state, mastra, suspend, resumeData, setState }) => {
    const questions = state.questions || [];

    // If resuming, store answers and continue
    if (resumeData) {
      if (resumeData.action === 'submit' && resumeData.answers) {
        await setState({ answers: resumeData.answers });
        console.log(`✅ [askQuestions] User submitted answers`);
      } else {
        console.log(`✅ [askQuestions] User skipped questions`);
      }
      return { action: 'proceed' as const, questions };
    }

    if (questions.length > 0) {
      // Update AEC state to suspended
      const aecRepository = mastra.getService('AECRepository') as any;
      const aec = await aecRepository.findById(inputData.aecId);
      if (aec) {
        aec.suspendForQuestions(questions);
        await executeWithRetry(
          () => aecRepository.update(aec),
          { stepName: 'askQuestions:update', maxAttempts: 3 }
        );
        console.log(`⏸️ [askQuestions] AEC transitioned to SUSPENDED_QUESTIONS`);
      }

      // Suspend workflow for user answers
      return await suspend({
        reason: 'questions' as const,
        questions,
        draft: {
          acceptanceCriteria: state.acceptanceCriteria || [],
          assumptions: state.assumptions || [],
          repoPaths: state.repoPaths || [],
        },
      });
    }

    return { action: 'proceed' as const, questions: [] };
  },
});

/**
 * Step 10: Refine Draft
 * Refines acceptance criteria based on user answers
 */
const refineDraftStep = createStep({
  id: 'refineDraft',
  description: 'Refine draft based on user answers (optional)',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    acceptanceCriteria: z.array(z.string()),
    assumptions: z.array(z.string()),
    repoPaths: z.array(z.string()),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    // If user provided answers, refine the draft
    if (state.answers && Object.keys(state.answers).length > 0) {
      const contentGenerator = mastra.getService('MastraContentGenerator') as any;

      try {
        const refineResult = await executeWithRetry(
          () => contentGenerator.refineDraft({
            acceptanceCriteria: state.acceptanceCriteria || [],
            assumptions: state.assumptions || [],
            answers: state.answers,
          }),
          { stepName: 'refineDraft', maxAttempts: 3 }
        );

        if (refineResult.success && refineResult.data) {
          await setState({
            acceptanceCriteria: refineResult.data.acceptanceCriteria,
            assumptions: refineResult.data.assumptions,
          });
          return {
            acceptanceCriteria: refineResult.data.acceptanceCriteria,
            assumptions: refineResult.data.assumptions,
            repoPaths: state.repoPaths || [],
          };
        }
      } catch (error) {
        console.warn('[refineDraft] Refinement failed, using original draft');
      }
    }

    // Return existing state if no refinement needed
    return {
      acceptanceCriteria: state.acceptanceCriteria || [],
      assumptions: state.assumptions || [],
      repoPaths: state.repoPaths || [],
    };
  },
});

/**
 * Step 11: Finalize
 * Persists all workflow outputs to AEC entity in Firestore
 */
const finalizeStep = createStep({
  id: 'finalize',
  description: 'Save workflow outputs to AEC entity, transition to VALIDATED, and unlock',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    unlocked: z.boolean(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, state, mastra }) => {
    const aecRepository = mastra.getService('AECRepository') as any;

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

    // Transition to VALIDATED state
    try {
      aec.validate([]);
      console.log(`📊 [finalize] AEC transitioned to VALIDATED`);
    } catch (stateError: any) {
      console.warn('[finalize] State transition failed:', stateError.message);
    }

    // Unlock the AEC
    aec.unlock();

    const persistResult = await executeWithRetry(
      () => aecRepository.update(aec),
      { stepName: 'finalize:persist', maxAttempts: 3 }
    );

    if (!persistResult.success) {
      throw persistResult.error || new Error('Failed to persist AEC after retries');
    }

    console.log(`✅ [finalize] Saved workflow outputs to AEC ${inputData.aecId}`);
    console.log(`🔓 [finalize] Unlocked AEC ${inputData.aecId}`);

    return { success: true, unlocked: true };
  },
});

// =============================================================================
// WORKFLOW DEFINITION
// =============================================================================

/**
 * Ticket Generation Workflow
 *
 * Flow:
 * 0. Initialize & Lock → 1. Extract Intent → 2. Detect Type → 3. Preflight Validation
 * 4. Review Findings (suspend if critical) → 5. Gather Repo Context → 6. Gather API Context
 * 7. Draft Ticket → 8. Generate Questions → 9. Ask Questions (suspend if questions)
 * 10. Refine Draft → 11. Finalize (save to AEC, unlock)
 */
export const ticketGenerationWorkflow = createWorkflow({
  id: 'ticket-generation',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    unlocked: z.boolean(),
  }),
  stateSchema: workflowStateSchema,
})
  .then(initializeAndLockStep)
  .then(extractIntentStep)
  .then(detectTypeStep)
  .then(preflightValidationStep)
  .then(reviewFindingsStep)
  .then(gatherRepoContextStep)
  .then(gatherApiContextStep)
  .then(draftTicketStep)
  .then(generateQuestionsStep)
  .then(askQuestionsStep)
  .then(refineDraftStep)
  .then(finalizeStep)
  .commit();
