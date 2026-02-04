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
import { getTelemetry } from '../application/services/WorkflowTelemetry';

// =============================================================================
// STEP PROGRESS HELPER
// =============================================================================

/**
 * HITL Generation Steps (12 total, 2 suspension points)
 */
const HITL_STEPS = [
  { id: 1, title: 'Extracting intent' },
  { id: 2, title: 'Detecting type' },
  { id: 3, title: 'Running preflight validation' },
  { id: 4, title: 'Review findings' }, // SUSPENSION POINT 1
  { id: 5, title: 'Gathering repository context' },
  { id: 6, title: 'Gathering API context' },
  { id: 7, title: 'Generating acceptance criteria' },
  { id: 8, title: 'Generating questions' },
  { id: 9, title: 'Ask questions' }, // SUSPENSION POINT 2
  { id: 10, title: 'Refining draft' },
  { id: 11, title: 'Finalizing ticket' },
  { id: 12, title: 'Unlocking' },
] as const;

/**
 * Update AEC generation state for real-time UI progress
 */
async function updateStepProgress(
  aecRepository: any,
  aecId: string,
  stepId: number,
  status: 'pending' | 'in-progress' | 'complete' | 'failed' | 'suspended',
  details?: string,
  suspensionReason?: 'critical_findings' | 'questions',
  extraData?: { findings?: any[]; questions?: any[] }
): Promise<void> {
  try {
    const aec = await aecRepository.findById(aecId);
    if (!aec) return;

    // Build steps array with current status
    const steps = HITL_STEPS.map((step) => {
      const stepData: Record<string, any> = {
        id: step.id,
        title: step.title,
        status: step.id < stepId ? 'complete' as const :
                step.id === stepId ? status :
                'pending' as const,
      };
      // Only add details/suspensionReason if they have values (Firestore can't handle undefined)
      if (step.id === stepId && details) {
        stepData.details = details;
      }
      if (step.id === stepId && suspensionReason) {
        stepData.suspensionReason = suspensionReason;
      }
      return stepData;
    });

    const generationState: any = {
      currentStep: stepId,
      steps,
    };

    // Add extra data for suspended states
    if (extraData?.findings) {
      generationState.findings = extraData.findings;
    }
    if (extraData?.questions) {
      generationState.questions = extraData.questions;
    }

    aec.updateGenerationState(generationState);
    await aecRepository.update(aec);
    console.log(`📊 [Progress] Step ${stepId}/${HITL_STEPS.length}: ${HITL_STEPS[stepId-1]?.title} - ${status}`);
  } catch (error) {
    console.error(`[updateStepProgress] Failed to update step ${stepId}:`, error);
  }
}

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
  // Core identifiers (set by first step, used by all others)
  aecId: z.string().optional(),
  workspaceId: z.string().optional(),
  workflowRunId: z.string().optional(),
  // Extracted data
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
    // Start workflow telemetry
    const workflowRunId = `workflow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    getTelemetry().startWorkflow(workflowRunId, inputData.aecId);
    getTelemetry().startStep('0', 'Initialize and Lock');
    
    console.log(`🔍 [initializeAndLock] Starting for AEC: ${inputData.aecId}`);
    
    const aecRepository = (mastra as any).getService('AECRepository') as any;
    if (!aecRepository) {
      throw new Error('AECRepository service not found in mastra context');
    }

    const aecLookupResult = await executeWithRetry(
      () => aecRepository.findById(inputData.aecId),
      { stepName: 'initializeAndLock:findById', maxAttempts: 3 }
    );

    if (!aecLookupResult.success || !aecLookupResult.data) {
      throw new Error(`AEC not found after retries: ${inputData.aecId}`);
    }

    const aec = aecLookupResult.data as any;

    if (aec.isLocked) {
      throw new Error(
        `AEC is already locked by workflow: ${aec.lockedBy}. Cannot start concurrent workflow.`
      );
    }

    // Validate workspace readiness if repository context exists
    if (aec.repositoryContext) {
      const indexQueryService = (mastra as any).getService('IndexQueryService') as any;
      if (indexQueryService?.getIndexStatus) {
        const indexStatusResult = await executeWithRetry(
          () => indexQueryService.getIndexStatus(aec.repositoryContext.indexId),
          { stepName: 'initializeAndLock:indexStatus', maxAttempts: 3 }
        );

        if (!indexStatusResult.success || !(indexStatusResult.data as any)?.ready) {
          const message = (indexStatusResult.data as any)?.message || 'Still indexing';
          // Warn but continue - workflow can proceed without index (reduced context)
          console.warn(`⚠️ [initializeAndLock] Repository index not ready: ${message}. Proceeding without code context.`);
        } else {
          console.log(`✅ [initializeAndLock] Repository index is ready`);
        }
      }
    }

    // Lock and transition to GENERATING state
    aec.startGenerating(workflowRunId);

    // Initialize generation state with HITL steps for real-time UI progress
    await updateStepProgress(aecRepository, inputData.aecId, 1, 'pending');

    const updateResult = await executeWithRetry(
      () => aecRepository.update(aec),
      { stepName: 'initializeAndLock:update', maxAttempts: 3 }
    );

    if (!updateResult.success) {
      throw updateResult.error || new Error('Failed to lock AEC after retries');
    }

    // Store aecId and workspaceId in state for subsequent steps
    await setState({ 
      aecId: inputData.aecId, 
      workspaceId: inputData.workspaceId, 
      workflowRunId 
    });
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
  inputSchema: z.object({}), // Input comes from previous step, we use state for aecId
  outputSchema: z.object({
    intent: z.string(),
    keywords: z.array(z.string()),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const aecId = (state as any).aecId!;
    
    const contentGenerator = (mastra as any).getService('MastraContentGenerator') as any;
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 1 in progress
    await updateStepProgress(aecRepository, aecId, 1, 'in-progress');

    const aec = await aecRepository.findById(aecId);
    if (!aec) {
      throw new Error(`AEC not found: ${aecId}`);
    }

    const intentResult = await executeWithRetry(
      () => contentGenerator.extractIntent({
        title: aec.title,
        description: aec.description || '',
      }),
      { stepName: 'extractIntent', maxAttempts: 3 }
    );

    if (!intentResult.success || !intentResult.data) {
      await updateStepProgress(aecRepository, aecId, 1, 'failed', intentResult.error?.message);
      throw intentResult.error || new Error('Failed to extract intent after retries');
    }

    const result = intentResult.data as any;
    await setState({ intent: result.intent, keywords: result.keywords });

    // Update progress: Step 1 complete
    await updateStepProgress(aecRepository, aecId, 1, 'complete', `Intent: ${result.intent.slice(0, 50)}...`);

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
  inputSchema: z.object({}),
  outputSchema: z.object({
    type: z.string(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const contentGenerator = (mastra as any).getService('MastraContentGenerator') as any;
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 2 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 2, 'in-progress');

    const typeResult = await executeWithRetry(
      () => contentGenerator.detectType((state as any).intent || ''),
      { stepName: 'detectType', maxAttempts: 3 }
    );

    if (!typeResult.success || !typeResult.data) {
      await updateStepProgress(aecRepository, (state as any).aecId!, 2, 'failed', typeResult.error?.message);
      throw typeResult.error || new Error('Failed to detect type after retries');
    }

    await setState({ type: (typeResult.data as any).type });

    // Update progress: Step 2 complete
    await updateStepProgress(aecRepository, (state as any).aecId!, 2, 'complete', `Type: ${(typeResult.data as any).type}`);

    return { type: (typeResult.data as any).type };
  },
});

/**
 * Step 3: Preflight Validation
 * Runs code-aware validation using QuickPreflightValidator
 */
const preflightValidationStep = createStep({
  id: 'preflightValidation',
  description: 'Run code-aware preflight validation',
  inputSchema: z.object({}),
  outputSchema: z.object({
    findings: z.array(findingSchema),
    hasCritical: z.boolean(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const workspaceFactory = (mastra as any).getService('MastraWorkspaceFactory') as any;
    const aecRepository = (mastra as any).getService('AECRepository') as any;
    const validator = (mastra as any).getService('QuickPreflightValidator') as any;

    // Update progress: Step 3 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 3, 'in-progress');

    const aec = await aecRepository.findById((state as any).aecId!);
    if (!aec) {
      throw new Error(`AEC not found: ${(state as any).aecId!}`);
    }

    if (!aec.repositoryContext) {
      console.warn('[preflightValidation] No repository context, skipping validation');
      await setState({ findings: [] });
      await updateStepProgress(aecRepository, (state as any).aecId!, 3, 'complete', 'No repository context');
      return { findings: [], hasCritical: false };
    }

    // Check if workspace factory and validator are available
    if (!workspaceFactory?.getOrCreateWorkspace || !validator?.validate) {
      console.warn('[preflightValidation] Validator services not available, skipping');
      await setState({ findings: [] });
      await updateStepProgress(aecRepository, (state as any).aecId!, 3, 'complete', 'Validation skipped');
      return { findings: [], hasCritical: false };
    }

    const workspace = await workspaceFactory.getOrCreateWorkspace(
      (state as any).workspaceId!,
      aec.repositoryContext.repositoryFullName,
      aec.repositoryContext.indexId
    );

    const findings = await validator.validate(aec, workspace);
    await setState({ findings });
    const hasCritical = findings.some((f: any) => f.severity === 'critical');

    // Update progress: Step 3 complete
    const findingsSummary = hasCritical ? `${findings.length} findings (CRITICAL)` : `${findings.length} findings`;
    await updateStepProgress(aecRepository, (state as any).aecId!, 3, 'complete', findingsSummary);

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
  inputSchema: z.object({}),
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
    const aecRepository = (mastra as any).getService('AECRepository') as any;
    const findings = (state as any).findings || [];
    const hasCritical = findings.some((f: any) => f.severity === 'critical');

    // Update progress: Step 4 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 4, 'in-progress');

    // If resuming, check the user's decision
    if (resumeData) {
      if (resumeData.action === 'cancel') {
        throw new Error('User cancelled workflow due to critical findings');
      }
      // User chose to proceed or edit - continue
      console.log(`✅ [reviewFindings] User chose to ${resumeData.action}`);
      await updateStepProgress(aecRepository, (state as any).aecId!, 4, 'complete', `User: ${resumeData.action}`);
      return { action: 'proceed' as const, findings };
    }

    if (hasCritical) {
      // Update AEC state to suspended
      const aec = await aecRepository.findById((state as any).aecId!);
      if (aec) {
        aec.suspendForFindingsReview(findings);
        await executeWithRetry(
          () => aecRepository.update(aec),
          { stepName: 'reviewFindings:update', maxAttempts: 3 }
        );
        console.log(`⏸️ [reviewFindings] AEC transitioned to SUSPENDED_FINDINGS`);
      }

      // Update progress: Step 4 suspended
      await updateStepProgress(aecRepository, (state as any).aecId!, 4, 'suspended', 'Critical findings require review', 'critical_findings', { findings });

      // Suspend workflow for user review
      return await suspend({
        reason: 'critical_findings' as const,
        findings,
      });
    }

    // No critical findings, proceed
    await updateStepProgress(aecRepository, (state as any).aecId!, 4, 'complete', 'No critical findings');
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
  inputSchema: z.object({}),
  outputSchema: z.object({
    repoContext: z.string(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const indexQueryService = (mastra as any).getService('IndexQueryService') as any;
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 5 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 5, 'in-progress');

    const aec = await aecRepository.findById((state as any).aecId!);
    if (!aec || !aec.repositoryContext) {
      console.warn('[gatherRepoContext] No repository context');
      await setState({ repoContext: '' });
      await updateStepProgress(aecRepository, (state as any).aecId!, 5, 'complete', 'No repository context');
      return { repoContext: '' };
    }

    // Check if service is available
    if (!indexQueryService?.getIndexStatus) {
      console.warn('[gatherRepoContext] IndexQueryService not available');
      await setState({ repoContext: '' });
      await updateStepProgress(aecRepository, (state as any).aecId!, 5, 'complete', 'Service unavailable');
      return { repoContext: '' };
    }

    const indexStatusResult = await executeWithRetry(
      () => indexQueryService.getIndexStatus(aec.repositoryContext.indexId),
      { stepName: 'gatherRepoContext:indexStatus', maxAttempts: 3 }
    );

    if (!indexStatusResult.success || !(indexStatusResult.data as any)?.ready) {
      console.warn('[gatherRepoContext] Index not ready, skipping');
      await setState({ repoContext: '' });
      await updateStepProgress(aecRepository, (state as any).aecId!, 5, 'complete', 'Index not ready');
      return { repoContext: '' };
    }

    const keywords = (state as any).keywords || [];
    const query = keywords.join(' ') || (state as any).intent || aec.title;

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
      await updateStepProgress(aecRepository, (state as any).aecId!, 5, 'complete', 'Query failed');
      return { repoContext: '' };
    }

    const repoContext = (queryResult.data as any[])
      .map((r: any) => `${r.path}:\n${r.snippet}`)
      .join('\n\n');

    await setState({ repoContext });
    await updateStepProgress(aecRepository, (state as any).aecId!, 5, 'complete', `Found ${(queryResult.data as any[]).length} relevant files`);
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
  inputSchema: z.object({}),
  outputSchema: z.object({
    apiContext: z.string(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 6 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 6, 'in-progress');

    // TODO: Implement API context gathering (Epic 7.4)
    await setState({ apiContext: '' });

    await updateStepProgress(aecRepository, (state as any).aecId!, 6, 'complete', 'API context skipped');
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
  inputSchema: z.object({}),
  outputSchema: z.object({
    acceptanceCriteria: z.array(z.string()),
    assumptions: z.array(z.string()),
    repoPaths: z.array(z.string()),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const contentGenerator = (mastra as any).getService('MastraContentGenerator') as any;
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 7 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 7, 'in-progress');

    const draftResult = await executeWithRetry(
      () => contentGenerator.generateDraft({
        intent: (state as any).intent || '',
        type: (state as any).type || 'FEATURE',
        repoContext: (state as any).repoContext || '',
        apiContext: (state as any).apiContext || '',
      }),
      { stepName: 'draftTicket', maxAttempts: 3 }
    );

    if (!draftResult.success || !draftResult.data) {
      await updateStepProgress(aecRepository, (state as any).aecId!, 7, 'failed', draftResult.error?.message);
      throw draftResult.error || new Error('Failed to generate draft after retries');
    }

    const result = draftResult.data;
    await setState({
      acceptanceCriteria: (result as any).acceptanceCriteria,
      assumptions: (result as any).assumptions,
      repoPaths: (result as any).repoPaths,
    });

    await updateStepProgress(aecRepository, (state as any).aecId!, 7, 'complete', `${(result as any).acceptanceCriteria.length} AC, ${(result as any).assumptions.length} assumptions`);

    return {
      acceptanceCriteria: (result as any).acceptanceCriteria,
      assumptions: (result as any).assumptions,
      repoPaths: (result as any).repoPaths,
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
  inputSchema: z.object({}),
  outputSchema: z.object({
    questions: z.array(questionSchema),
    hasQuestions: z.boolean(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const findingsAgent = (mastra as any).getService('FindingsToQuestionsAgent') as any;
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 8 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 8, 'in-progress');

    // Check if agent is available
    if (!findingsAgent?.generateQuestions) {
      console.warn('[generateQuestions] FindingsToQuestionsAgent not available, skipping');
      await setState({ questions: [] });
      await updateStepProgress(aecRepository, (state as any).aecId!, 8, 'complete', 'Questions skipped');
      return { questions: [], hasQuestions: false };
    }

    const questionsResult = await executeWithRetry(
      () => findingsAgent.generateQuestions({
        findings: (state as any).findings || [],
        acceptanceCriteria: (state as any).acceptanceCriteria || [],
        assumptions: (state as any).assumptions || [],
      }),
      { stepName: 'generateQuestions', maxAttempts: 3 }
    );

    if (!questionsResult.success || !questionsResult.data) {
      console.warn('[generateQuestions] Failed to generate questions, proceeding without');
      await setState({ questions: [] });
      await updateStepProgress(aecRepository, (state as any).aecId!, 8, 'complete', 'No questions generated');
      return { questions: [] as any[], hasQuestions: false };
    }

    // Map question types to match workflow schema (single_choice -> radio, multiple_choice -> checkbox)
    // Also rename 'question' to 'text' and remove undefined values that Firestore can't handle
    const rawQuestions = questionsResult.data as any[];
    const questions = rawQuestions.map(q => {
      const mapped: any = {
        id: q.id,
        text: q.question || q.text, // Map question -> text
        type: q.type === 'single_choice' ? 'radio' : 
              q.type === 'multiple_choice' ? 'checkbox' : 
              q.type || 'text'
      };
      // Only add options if they exist (Firestore doesn't accept undefined)
      if (q.options && Array.isArray(q.options) && q.options.length > 0) {
        mapped.options = q.options;
      }
      if (q.required !== undefined) {
        mapped.required = q.required;
      }
      return mapped;
    });
    
    await setState({ questions });

    await updateStepProgress(aecRepository, (state as any).aecId!, 8, 'complete', `${questions.length} questions`);
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
  inputSchema: z.object({}),
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
    const aecRepository = (mastra as any).getService('AECRepository') as any;
    const questions = (state as any).questions || [];

    // Update progress: Step 9 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 9, 'in-progress');

    // If resuming, store answers and continue
    if (resumeData) {
      if (resumeData.action === 'submit' && resumeData.answers) {
        await setState({ answers: resumeData.answers });
        console.log(`✅ [askQuestions] User submitted answers`);
        await updateStepProgress(aecRepository, (state as any).aecId!, 9, 'complete', 'Answers submitted');
      } else {
        console.log(`✅ [askQuestions] User skipped questions`);
        await updateStepProgress(aecRepository, (state as any).aecId!, 9, 'complete', 'Questions skipped');
      }
      return { action: 'proceed' as const, questions };
    }

    // Store questions in state for later review (don't suspend - let workflow complete)
    if (questions.length > 0) {
      await setState({ questions });
      console.log(`📝 [askQuestions] Stored ${questions.length} questions for final review`);
      await updateStepProgress(aecRepository, (state as any).aecId!, 9, 'complete', `Generated ${questions.length} clarifying questions`);
    } else {
      console.log(`✅ [askQuestions] No questions generated, continuing`);
      await updateStepProgress(aecRepository, (state as any).aecId!, 9, 'complete', 'No additional questions needed');
    }

    // Always proceed (no suspension)
    return { action: 'proceed' as const, questions };
    await updateStepProgress(aecRepository, (state as any).aecId!, 9, 'complete', 'No questions');
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
  inputSchema: z.object({}),
  outputSchema: z.object({
    acceptanceCriteria: z.array(z.string()),
    assumptions: z.array(z.string()),
    repoPaths: z.array(z.string()),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ state, mastra, setState }) => {
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 10 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 10, 'in-progress');

    // If user provided answers, refine the draft
    if ((state as any).answers && Object.keys((state as any).answers).length > 0) {
      const contentGenerator = (mastra as any).getService('MastraContentGenerator') as any;

      try {
        const refineResult = await executeWithRetry(
          () => contentGenerator.refineDraft({
            acceptanceCriteria: (state as any).acceptanceCriteria || [],
            assumptions: (state as any).assumptions || [],
            answers: (state as any).answers,
          }),
          { stepName: 'refineDraft', maxAttempts: 3 }
        );

        if (refineResult.success && refineResult.data) {
          const refined = refineResult.data as any;
          await setState({
            acceptanceCriteria: refined.acceptanceCriteria,
            assumptions: refined.assumptions,
          });
          await updateStepProgress(aecRepository, (state as any).aecId!, 10, 'complete', 'Draft refined with answers');
          return {
            acceptanceCriteria: refined.acceptanceCriteria,
            assumptions: refined.assumptions,
            repoPaths: (state as any).repoPaths || [],
          };
        }
      } catch (error) {
        console.warn('[refineDraft] Refinement failed, using original draft');
      }
    }

    // Return existing state if no refinement needed
    await updateStepProgress(aecRepository, (state as any).aecId!, 10, 'complete', 'No refinement needed');
    return {
      acceptanceCriteria: (state as any).acceptanceCriteria || [],
      assumptions: (state as any).assumptions || [],
      repoPaths: (state as any).repoPaths || [],
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
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    unlocked: z.boolean(),
  }),
  stateSchema: workflowStateSchema,
  execute: async ({ inputData, state, mastra }) => {
    const aecRepository = (mastra as any).getService('AECRepository') as any;

    // Update progress: Step 11 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 11, 'in-progress');

    const aec = await aecRepository.findById((state as any).aecId!);
    if (!aec) {
      throw new Error(`AEC not found: ${(state as any).aecId!}`);
    }

    // Update AEC with workflow outputs
    aec.updateContent(
      (state as any).type || null,
      (state as any).acceptanceCriteria || [],
      (state as any).assumptions || [],
      (state as any).repoPaths || [],
    );

    // Transition to VALIDATED state
    try {
      aec.validate([]);
      console.log(`📊 [finalize] AEC transitioned to VALIDATED`);
    } catch (stateError: any) {
      console.warn('[finalize] State transition failed:', stateError.message);
    }

    // Update progress: Step 11 complete, Step 12 in progress
    await updateStepProgress(aecRepository, (state as any).aecId!, 11, 'complete', 'Content saved');
    await updateStepProgress(aecRepository, (state as any).aecId!, 12, 'in-progress');

    // Unlock the AEC
    aec.unlock();

    const persistResult = await executeWithRetry(
      () => aecRepository.update(aec),
      { stepName: 'finalize:persist', maxAttempts: 3 }
    );

    if (!persistResult.success) {
      await updateStepProgress(aecRepository, (state as any).aecId!, 12, 'failed', 'Failed to save');
      throw persistResult.error || new Error('Failed to persist AEC after retries');
    }

    // Update progress: Step 12 complete (all done!)
    await updateStepProgress(aecRepository, (state as any).aecId!, 12, 'complete', 'Unlocked');

    console.log(`✅ [finalize] Saved workflow outputs to AEC ${(state as any).aecId!}`);
    console.log(`🔓 [finalize] Unlocked AEC ${(state as any).aecId!}`);

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
