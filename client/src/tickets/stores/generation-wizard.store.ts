import { create } from 'zustand';
import { ProjectStack } from '@/tickets/domain/stack-detection/ProjectStackDetector';
import { CodebaseAnalysis } from '@/tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { TechSpec, ClarificationQuestion } from '@/tickets/domain/tech-spec/TechSpecGenerator';

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
 * Question round data
 */
export interface QuestionRound {
  roundNumber: 1 | 2 | 3;
  questions: ClarificationQuestion[];
  answers: Record<string, string | string[]>;
  generatedAt: Date;
  answeredAt: Date | null;
  skippedByUser: boolean;
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
  answers: Record<string, string | string[]>; // Legacy: Clarification question answers
  // Iterative refinement workflow
  draftAecId: string | null;
  questionRounds: QuestionRound[];
  currentRound: number;
  roundStatus: 'idle' | 'generating' | 'answering' | 'submitting' | 'finalizing';
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

  // Draft stage (legacy single spec)
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  editSpec: (section: string, updates: any) => void;
  confirmSpecContinue: () => void;

  // Iterative refinement workflow (NEW)
  startQuestionRound: (aecId: string, roundNumber: 1 | 2 | 3) => Promise<void>;
  answerQuestionInRound: (round: number, questionId: string, answer: string | string[]) => void;
  submitRoundAnswers: (roundNumber: number) => Promise<'continue' | 'finalize'>;
  skipToFinalize: () => Promise<void>;
  finalizeSpec: () => Promise<void>;
  resumeDraft: (aecId: string) => Promise<void>;

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
  draftAecId: null,
  questionRounds: [],
  currentRound: 0,
  roundStatus: 'idle',
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
   * Creates draft AEC and starts first question round
   */
  confirmContextContinue: async () => {
    const state = get();
    if (!state.input.title || !state.input.repoOwner || !state.input.repoName) return;

    set({ loading: true, error: null });

    try {
      // Create draft AEC
      const createResponse = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.input.title,
          description: state.input.description,
          repositoryContext: {
            owner: state.input.repoOwner,
            name: state.input.repoName,
            branch: state.input.branch || 'main',
          },
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create ticket: ${createResponse.statusText}`);
      }

      const aec = await createResponse.json();
      set({
        draftAecId: aec.id,
        currentStage: 3,
        loading: false,
      });

      // Start first question round (will be initiated by Stage 3 component)
      await get().startQuestionRound(aec.id, 1);
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
   * User confirms draft review is complete
   * Advances to stage 4 (final review)
   */
  confirmSpecContinue: () =>
    set({
      currentStage: 4,
    }),

  // ============================================================================
  // ITERATIVE REFINEMENT WORKFLOW (Stage 3 Alternative)
  // ============================================================================

  /**
   * Start a new question round
   * Calls backend to generate context-aware questions
   */
  startQuestionRound: async (aecId: string, roundNumber: 1 | 2 | 3) => {
    const state = get();
    set({ roundStatus: 'generating', error: null });

    try {
      const response = await fetch(`/api/tickets/${aecId}/start-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start round: ${response.statusText}`);
      }

      const { questionRounds, currentRound } = await response.json();
      set({
        draftAecId: aecId,
        questionRounds,
        currentRound,
        roundStatus: 'idle',
        currentStage: 3, // Ensure we're on stage 3
      });

      // Auto-save to localStorage
      localStorage.setItem('wizard-draft-aec-id', aecId);
      localStorage.setItem('wizard-question-rounds', JSON.stringify(questionRounds));
      localStorage.setItem('wizard-current-round', String(currentRound));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        roundStatus: 'idle',
      });
    }
  },

  /**
   * User answers a question in current round
   * Auto-saves to localStorage
   */
  answerQuestionInRound: (round: number, questionId: string, answer: string | string[]) => {
    set((state) => {
      const updatedRounds = [...state.questionRounds];
      const roundIdx = updatedRounds.findIndex((r) => r.roundNumber === round);

      if (roundIdx >= 0) {
        updatedRounds[roundIdx] = {
          ...updatedRounds[roundIdx],
          answers: {
            ...updatedRounds[roundIdx].answers,
            [questionId]: answer,
          },
        };
      }

      // Auto-save to localStorage (debounced in practice)
      localStorage.setItem('wizard-question-rounds', JSON.stringify(updatedRounds));

      return { questionRounds: updatedRounds };
    });
  },

  /**
   * Submit answers for current round
   * Backend decides: continue to next round or finalize
   */
  submitRoundAnswers: async (roundNumber: number) => {
    const state = get();
    if (!state.draftAecId) {
      set({ error: 'No draft AEC found' });
      return 'finalize';
    }

    set({ roundStatus: 'submitting', error: null });

    try {
      const round = state.questionRounds.find((r) => r.roundNumber === roundNumber);
      if (!round) {
        throw new Error(`Round ${roundNumber} not found`);
      }

      const response = await fetch(`/api/tickets/${state.draftAecId}/submit-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundNumber,
          answers: round.answers,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit answers: ${response.statusText}`);
      }

      const { aec, nextAction } = await response.json();

      if (nextAction === 'continue') {
        // Backend will have started next round, fetch updated AEC
        set({
          questionRounds: aec.questionRounds || state.questionRounds,
          currentRound: aec.currentRound || state.currentRound,
          roundStatus: 'idle',
        });

        // Auto-save
        localStorage.setItem('wizard-question-rounds', JSON.stringify(aec.questionRounds));
        localStorage.setItem('wizard-current-round', String(aec.currentRound));
      } else {
        // Will finalize next
        set({ roundStatus: 'idle' });
      }

      return nextAction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        roundStatus: 'idle',
      });
      return 'finalize';
    }
  },

  /**
   * User manually skips remaining rounds
   */
  skipToFinalize: async () => {
    const state = get();
    if (!state.draftAecId) {
      set({ error: 'No draft AEC found' });
      return;
    }

    set({ roundStatus: 'submitting', error: null });

    try {
      const response = await fetch(`/api/tickets/${state.draftAecId}/skip-to-finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to skip: ${response.statusText}`);
      }

      set({ roundStatus: 'idle' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        roundStatus: 'idle',
      });
    }
  },

  /**
   * Generate final tech spec with all accumulated answers
   */
  finalizeSpec: async () => {
    const state = get();
    if (!state.draftAecId) {
      set({ error: 'No draft AEC found' });
      return;
    }

    set({ roundStatus: 'finalizing', error: null });

    try {
      const response = await fetch(`/api/tickets/${state.draftAecId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to finalize: ${response.statusText}`);
      }

      const aec = await response.json();

      set({
        spec: aec.techSpec,
        roundStatus: 'idle',
        currentStage: 4, // Advance to review stage
      });

      // Clear localStorage draft
      localStorage.removeItem('wizard-draft-aec-id');
      localStorage.removeItem('wizard-question-rounds');
      localStorage.removeItem('wizard-current-round');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        roundStatus: 'idle',
      });
    }
  },

  /**
   * Resume a draft from localStorage or backend
   * Restores all question rounds and answers
   */
  resumeDraft: async (aecId: string) => {
    set({ loading: true, error: null });

    try {
      // Fetch full AEC with all question rounds
      const response = await fetch(`/api/tickets/${aecId}`);
      if (!response.ok) {
        throw new Error(`Failed to load draft: ${response.statusText}`);
      }

      const aec = await response.json();

      set({
        draftAecId: aecId,
        questionRounds: aec.questionRounds || [],
        currentRound: aec.currentRound || 0,
        currentStage: 3, // Go to question stage
        input: {
          title: aec.title,
          repoOwner: '', // Not needed for resume
          repoName: '',
        },
        loading: false,
      });

      // Restore localStorage
      localStorage.setItem('wizard-draft-aec-id', aecId);
      localStorage.setItem('wizard-question-rounds', JSON.stringify(aec.questionRounds));
      localStorage.setItem('wizard-current-round', String(aec.currentRound));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

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
  reset: () => {
    // Clear localStorage
    localStorage.removeItem('wizard-draft-aec-id');
    localStorage.removeItem('wizard-question-rounds');
    localStorage.removeItem('wizard-current-round');

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
      draftAecId: null,
      questionRounds: [],
      currentRound: 0,
      roundStatus: 'idle',
      loading: false,
      error: null,
    });
  },
}));
