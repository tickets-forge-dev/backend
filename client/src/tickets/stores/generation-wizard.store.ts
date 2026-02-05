import { create } from 'zustand';
import { ProjectStack } from '@tickets/domain/stack-detection/ProjectStackDetector';
import { CodebaseAnalysis } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { TechSpec, ClarificationQuestion } from '@tickets/domain/tech-spec/TechSpecGenerator';

/**
 * File entry discovered during repository analysis
 */
export interface FileEntry {
  path: string;
  name: string;
  size?: number;
  isDirectory: boolean;
}

/**
 * Wizard state shape
 */
export interface WizardState {
  currentStage: number; // 1-4
  input: {
    title: string;
    repoOwner: string;
    repoName: string;
  };
  context: {
    stack: ProjectStack;
    analysis: CodebaseAnalysis;
    files: FileEntry[];
  } | null;
  spec: TechSpec | null;
  answers: Record<string, string | string[]>; // Clarification question answers
  loading: boolean;
  error: string | null;
}

/**
 * Wizard actions
 */
export interface WizardActions {
  // Input stage
  setTitle: (title: string) => void;
  setRepository: (owner: string, name: string) => void;

  // Context stage
  analyzeRepository: () => Promise<void>;
  editStack: (updates: Partial<ProjectStack>) => void;
  editAnalysis: (updates: Partial<CodebaseAnalysis>) => void;
  confirmContextContinue: () => void;

  // Draft stage
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  editSpec: (section: string, updates: any) => void;
  confirmSpecContinue: () => void;

  // Navigation
  goBackToInput: () => void;
  goBackToContext: () => void;
  goBackToSpec: () => void;

  // Error handling
  setError: (error: string | null) => void;
  reset: () => void;

  // Review stage
  createTicket: () => Promise<void>;
}

/**
 * Generation Wizard Store
 *
 * Manages the complete state of the 4-stage ticket generation wizard:
 * 1. Input: User enters title and selects repository
 * 2. Context: Displays detected stack, patterns, and files for review
 * 3. Draft: Shows generated spec with clarification questions
 * 4. Review: Final ticket summary with quality score
 *
 * All state changes flow through actions for predictable updates.
 * API calls (analyzeRepository, createTicket) trigger loading/error states.
 */
export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================

  currentStage: 1,
  input: {
    title: '',
    repoOwner: '',
    repoName: '',
  },
  context: null,
  spec: null,
  answers: {},
  loading: false,
  error: null,

  // ============================================================================
  // STAGE 1: INPUT ACTIONS
  // ============================================================================

  setTitle: (title: string) =>
    set((state) => ({
      input: { ...state.input, title },
    })),

  setRepository: (owner: string, name: string) =>
    set((state) => ({
      input: { ...state.input, repoOwner: owner, repoName: name },
    })),

  // ============================================================================
  // STAGE 2: CONTEXT ACTIONS
  // ============================================================================

  /**
   * Calls backend to analyze repository
   * Fetches stack, codebase analysis, and important files
   * Advances to stage 2 on success
   */
  analyzeRepository: async () => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/tickets/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: state.input.repoOwner,
          repo: state.input.repoName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const { context } = await response.json();
      set({
        context,
        currentStage: 2,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  /**
   * Updates detected stack information
   * Stays on stage 2 for user review
   */
  editStack: (updates: Partial<ProjectStack>) =>
    set((state) => ({
      context: state.context
        ? {
            ...state.context,
            stack: { ...state.context.stack, ...updates },
          }
        : null,
    })),

  /**
   * Updates codebase analysis information
   * Stays on stage 2 for user review
   */
  editAnalysis: (updates: Partial<CodebaseAnalysis>) =>
    set((state) => ({
      context: state.context
        ? {
            ...state.context,
            analysis: { ...state.context.analysis, ...updates },
          }
        : null,
    })),

  /**
   * User confirms context review is complete
   * Generates tech spec from context and advances to stage 3
   */
  confirmContextContinue: async () => {
    const state = get();
    if (!state.context) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/tickets/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.input.title,
          owner: state.input.repoOwner,
          repo: state.input.repoName,
          context: state.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Spec generation failed: ${response.statusText}`);
      }

      const { spec } = await response.json();
      set({
        spec,
        currentStage: 3,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  // ============================================================================
  // STAGE 3: DRAFT ACTIONS
  // ============================================================================

  /**
   * User answers a clarification question
   * Auto-saves to store for later use
   */
  answerQuestion: (questionId: string, answer: string | string[]) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    })),

  /**
   * User edits a section of the generated spec
   * Stays on stage 3 for continued review/editing
   */
  editSpec: (section: string, updates: any) =>
    set((state) => ({
      spec: state.spec
        ? {
            ...state.spec,
            [section]: updates,
          }
        : null,
    })),

  /**
   * User confirms draft review is complete
   * Advances to stage 4 (final review)
   */
  confirmSpecContinue: () =>
    set({
      currentStage: 4,
    }),

  // ============================================================================
  // STAGE 4: REVIEW ACTIONS
  // ============================================================================

  /**
   * User creates the ticket with current spec and answers
   * Calls backend to persist ticket
   */
  createTicket: async () => {
    const state = get();
    if (!state.spec) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/tickets/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: state.spec,
          answers: state.answers,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ticket creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      set({
        loading: false,
      });

      // Success - ideally navigate user to ticket detail or list
      // This would be handled by calling component
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  // ============================================================================
  // NAVIGATION ACTIONS
  // ============================================================================

  goBackToInput: () =>
    set({
      currentStage: 1,
      error: null,
    }),

  goBackToContext: () =>
    set({
      currentStage: 2,
      error: null,
    }),

  goBackToSpec: () =>
    set({
      currentStage: 3,
      error: null,
    }),

  // ============================================================================
  // ERROR HANDLING & RESET
  // ============================================================================

  setError: (error: string | null) =>
    set({ error }),

  /**
   * Resets wizard to initial state
   * Called when user wants to start over
   */
  reset: () =>
    set({
      currentStage: 1,
      input: {
        title: '',
        repoOwner: '',
        repoName: '',
      },
      context: null,
      spec: null,
      answers: {},
      loading: false,
      error: null,
    }),
}));
