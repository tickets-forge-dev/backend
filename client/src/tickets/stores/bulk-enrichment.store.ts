/**
 * Bulk Enrichment Store
 *
 * Manages state for parallel ticket enrichment and finalization flow.
 * Tracks agent progress, questions, and answers across multiple tickets.
 */

import { create } from 'zustand';

/**
 * Enriched question from API
 */
export interface EnrichedQuestion {
  id: string;
  question: string;
  type: 'radio' | 'checkbox' | 'text' | 'multiline' | 'select';
  options?: string[];
  context?: string;
  impact?: string;
}

/**
 * User answer to a question
 */
export interface QuestionAnswer {
  ticketId: string;
  questionId: string;
  answer: string;
}

/**
 * Agent progress state
 */
export interface AgentProgress {
  agentId: number;
  ticketId: string;
  ticketTitle: string;
  phase: 'deep_analysis' | 'question_generation' | 'complete' | 'error';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
  questionCount?: number;
  error?: string;
}

/**
 * Bulk enrichment store state
 */
export interface BulkEnrichmentState {
  // Tickets being enriched
  tickets: Array<{ id: string; title: string }>;

  // Agent progress tracking (by agentId)
  agentProgress: Map<number, AgentProgress>;

  // Questions collected from enrichment (by ticketId)
  questions: Map<string, EnrichedQuestion[]>;

  // User answers (by questionId)
  answers: Map<string, string>;

  // Errors during enrichment (by ticketId)
  errors: Map<string, string>;

  // Current phase
  phase: 'idle' | 'enriching' | 'answering' | 'finalizing' | 'complete' | 'error';

  // Counts
  enrichedCount: number;
  failedCount: number;
  finalizedCount: number;

  // Estimated time remaining (seconds)
  estimatedTimeRemaining: number;

  // Actions
  initializeEnrichment: (ticketIds: string[], tickets: Array<{ id: string; title: string }>) => void;
  updateAgentProgress: (event: any) => void;
  setQuestions: (ticketId: string, questions: EnrichedQuestion[]) => void;
  setEnrichmentComplete: (questions: Map<string, EnrichedQuestion[]>, errors: Map<string, string>, completedCount: number, failedCount: number) => void;
  recordAnswer: (questionId: string, answer: string) => void;
  startFinalization: () => void;
  updateFinalizationProgress: (event: any) => void;
  setFinalizationComplete: (results: any) => void;
  reset: () => void;
}

/**
 * Create bulk enrichment store
 */
export const useBulkEnrichmentStore = create<BulkEnrichmentState>((set, get) => ({
  // Initial state
  tickets: [],
  agentProgress: new Map(),
  questions: new Map(),
  answers: new Map(),
  errors: new Map(),
  phase: 'idle',
  enrichedCount: 0,
  failedCount: 0,
  finalizedCount: 0,
  estimatedTimeRemaining: 0,

  // Initialize enrichment
  initializeEnrichment: (ticketIds: string[], tickets: Array<{ id: string; title: string }>) => {
    set({
      tickets,
      phase: 'enriching',
      agentProgress: new Map(),
      questions: new Map(),
      answers: new Map(),
      errors: new Map(),
      enrichedCount: 0,
      failedCount: 0,
      finalizedCount: 0,
      estimatedTimeRemaining: 25, // Estimate 25-35s for enrichment
    });
  },

  // Update agent progress
  updateAgentProgress: (event: any) => {
    if (event.type === 'progress' || event.type === 'error') {
      const agentId = event.agentId;
      const progress = {
        agentId,
        ticketId: event.ticketId,
        ticketTitle: event.ticketTitle,
        phase: event.phase,
        status: event.status,
        message: event.message,
        questionCount: event.metadata?.questionCount,
        error: event.metadata?.error,
      };

      set((state) => {
        const newProgress = new Map(state.agentProgress);
        newProgress.set(agentId, progress);
        return { agentProgress: newProgress };
      });
    }
  },

  // Set questions for a ticket
  setQuestions: (ticketId: string, questions: EnrichedQuestion[]) => {
    set((state) => {
      const newQuestions = new Map(state.questions);
      newQuestions.set(ticketId, questions);
      return { questions: newQuestions };
    });
  },

  // Enrichment complete
  setEnrichmentComplete: (questions: Map<string, EnrichedQuestion[]>, errors: Map<string, string>, completedCount: number, failedCount: number) => {
    set({
      questions,
      errors,
      enrichedCount: completedCount,
      failedCount,
      phase: 'answering',
      estimatedTimeRemaining: 0,
    });
  },

  // Record answer
  recordAnswer: (questionId: string, answer: string) => {
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answer);
      return { answers: newAnswers };
    });
  },

  // Start finalization
  startFinalization: () => {
    set({
      phase: 'finalizing',
      estimatedTimeRemaining: 15, // Estimate 10-15s for finalization
    });
  },

  // Update finalization progress
  updateFinalizationProgress: (event: any) => {
    if (event.type === 'progress' || event.type === 'error') {
      const agentId = event.agentId;
      const progress = {
        agentId,
        ticketId: event.ticketId,
        ticketTitle: event.ticketTitle,
        phase: event.phase,
        status: event.status,
        message: event.message,
        error: event.metadata?.error,
      };

      set((state) => {
        const newProgress = new Map(state.agentProgress);
        newProgress.set(agentId, progress);
        return { agentProgress: newProgress };
      });
    }
  },

  // Finalization complete
  setFinalizationComplete: (results: any) => {
    set({
      phase: 'complete',
      finalizedCount: results.completedCount,
      estimatedTimeRemaining: 0,
    });
  },

  // Reset store
  reset: () => {
    set({
      tickets: [],
      agentProgress: new Map(),
      questions: new Map(),
      answers: new Map(),
      errors: new Map(),
      phase: 'idle',
      enrichedCount: 0,
      failedCount: 0,
      finalizedCount: 0,
      estimatedTimeRemaining: 0,
    });
  },
}));
