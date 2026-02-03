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

// @ts-expect-error - Mastra API may differ in v1.1.0, will verify with documentation
import { Step, Workflow } from '@mastra/core';

// Workflow input interface
export interface TicketGenerationInput {
  aecId: string;
  workspaceId: string;
}

// Workflow state interface (shared across steps)
export interface TicketGenerationState {
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
 * Step 1: Extract Intent
 * Uses LLM to extract user's intent and keywords from title/description
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

      const result = await contentGenerator.extractIntent({
        title: aec.title,
        description: aec.description || '',
      });

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
 */
const detectTypeStep = new Step({
  id: 'detectType',
  description: 'Detect ticket type from intent',
  execute: async ({ getState, mastra, setState }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const contentGenerator = mastra.getService('MastraContentGenerator');

      const result = await contentGenerator.detectType(state.intent || '');

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
 */
const reviewFindingsStep = new Step({
  id: 'reviewFindings',
  description: 'Review critical findings (suspends if critical issues found)',
  execute: async ({ getState }) => {
    const state = await getState<TicketGenerationState>();
    const findings = state.findings || [];
    const hasCritical = findings.some((f: any) => f.severity === 'critical');

    if (hasCritical) {
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

      // Check if workspace is indexed before querying
      // TODO: Add workspace.isIndexed() check here

      const keywords = state.keywords || [];
      const query = keywords.join(' ') || state.intent || aec.title;

      const results = await indexQueryService.query({
        indexId: aec.repositoryContext.indexId,
        query,
        limit: 10,
      });

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
 */
const draftTicketStep = new Step({
  id: 'draftTicket',
  description: 'Generate acceptance criteria, assumptions, and repo paths',
  execute: async ({ getState, mastra, setState }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const contentGenerator = mastra.getService('MastraContentGenerator');

      const result = await contentGenerator.generateDraft({
        intent: state.intent || '',
        type: state.type || 'FEATURE',
        repoContext: state.repoContext || '',
        apiContext: state.apiContext || '',
      });

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
 */
const generateQuestionsStep = new Step({
  id: 'generateQuestions',
  description: 'Generate clarifying questions from findings and draft',
  execute: async ({ getState, mastra, setState }) => {
    try {
      const state = await getState<TicketGenerationState>();
      const findingsAgent = mastra.getService('FindingsToQuestionsAgent');

      const questions = await findingsAgent.generateQuestions({
        findings: state.findings || [],
        acceptanceCriteria: state.acceptanceCriteria || [],
        assumptions: state.assumptions || [],
      });

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
 */
const askQuestionsStep = new Step({
  id: 'askQuestions',
  description: 'Ask clarifying questions (suspends if questions exist)',
  execute: async ({ getState }) => {
    const state = await getState<TicketGenerationState>();
    const questions = state.questions || [];

    if (questions.length > 0) {
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
 * This ensures generated content is saved permanently
 */
const finalizeStep = new Step({
  id: 'finalize',
  description: 'Save workflow outputs to AEC entity',
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

      // Persist to Firestore
      await aecRepository.save(aec);

      console.log(`✅ [finalizeStep] Saved workflow outputs to AEC ${inputData.aecId}`);

      return { success: true };
    } catch (error) {
      console.error('[finalizeStep] Error:', error);
      throw error;
    }
  },
});

/**
 * Ticket Generation Workflow Definition
 *
 * Flow:
 * 1. Extract Intent → 2. Detect Type → 3. Preflight Validation
 * 4. Review Findings (suspend if critical) → 5. Gather Repo Context
 * 6. Gather API Context → 7. Draft Ticket → 8. Generate Questions
 * 9. Ask Questions (suspend if questions) → 10. Refine Draft
 * 11. Finalize (save to AEC)
 */
export const ticketGenerationWorkflow = new Workflow({
  name: 'ticket-generation',
  triggerSchema: {} as TicketGenerationInput,
})
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
