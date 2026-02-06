import { create } from 'zustand';
import type { ClarificationQuestion, TechSpec, QuestionRound as FrontendQuestionRound } from '@/types/question-refinement';
import { useTicketsStore } from '@/stores/tickets.store';
import { auth } from '@/lib/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Authenticated fetch wrapper that adds Firebase Bearer token and uses correct API base URL.
 * Matches the auth pattern used by GitHubService's Axios interceptor.
 */
async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, { ...init, headers });
}

/**
 * File entry discovered during repository analysis
 */
export interface FileEntry {
  path: string;
  name: string;
  size?: number;
  isDirectory: boolean;
}

// Re-export frontend question round type
export type QuestionRound = FrontendQuestionRound;

/**
 * Task-specific deep analysis returned by LLM
 */
export interface TaskAnalysis {
  filesToModify: Array<{
    path: string;
    reason: string;
    currentPurpose: string;
    suggestedChanges: string;
  }>;
  filesToCreate: Array<{
    path: string;
    reason: string;
    patternToFollow: string;
  }>;
  relevantPatterns: Array<{
    name: string;
    exampleFile: string;
    description: string;
  }>;
  risks: Array<{
    area: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  integrationConcerns: Array<{
    system: string;
    concern: string;
    recommendation: string;
  }>;
  implementationHints: {
    existingPatterns: string[];
    conventionsToFollow: string[];
    testingApproach: string;
    estimatedComplexity: 'low' | 'medium' | 'high';
    recommendedRounds: number;
  };
  llmFilesRead: string[];
  analysisTimestamp: string;
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
    description?: string;
    branch?: string;
  };
  context: {
    stack: any;
    analysis: any;
    files: FileEntry[];
    taskAnalysis: TaskAnalysis | null;
  } | null;
  spec: TechSpec | null;
  answers: Record<string, string | string[]>; // Legacy: Clarification question answers
  // Iterative refinement workflow
  draftAecId: string | null;
  questionRounds: QuestionRound[];
  currentRound: number;
  maxRounds: number;
  roundStatus: 'idle' | 'generating' | 'answering' | 'submitting' | 'finalizing';
  loading: boolean;
  loadingMessage: string | null;
  progressPercent: number;
  error: string | null;
}

/**
 * Wizard actions
 */
export interface WizardActions {
  // Input stage
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setRepository: (owner: string, name: string) => void;

  // Context stage
  analyzeRepository: () => Promise<void>;
  editStack: (updates: any) => void; // Legacy: ProjectStack type
  editAnalysis: (updates: any) => void; // Legacy: CodebaseAnalysis type
  confirmContextContinue: () => void;

  // Draft stage (legacy single spec)
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  editSpec: (section: string, updates: any) => void;
  confirmSpecContinue: () => void;

  // Iterative refinement workflow (NEW)
  startQuestionRound: (aecId: string, roundNumber: number) => Promise<void>;
  answerQuestionInRound: (round: number, questionId: string, answer: string | string[]) => void;
  submitRoundAnswers: (roundNumber: number, answers?: Record<string, string | string[]>) => Promise<'continue' | 'finalize'>;
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
  maxRounds: 3,
  roundStatus: 'idle',
  loading: false,
  loadingMessage: null,
  progressPercent: 0,
  error: null,

  // ============================================================================
  // STAGE 1: INPUT ACTIONS
  // ============================================================================

  setTitle: (title: string) =>
    set((state) => ({
      input: { ...state.input, title },
    })),

  setDescription: (description: string) =>
    set((state) => ({
      input: { ...state.input, description },
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
    const ticketsState = useTicketsStore.getState();
    set({ loading: true, loadingMessage: 'Connecting to GitHub...', progressPercent: 0, error: null });

    try {
      const branch = ticketsState.selectedBranch || ticketsState.defaultBranch || 'main';

      const response = await authFetch('/tickets/analyze-repo', {
        method: 'POST',
        body: JSON.stringify({
          owner: state.input.repoOwner,
          repo: state.input.repoName,
          branch,
          title: state.input.title,
          description: state.input.description,
        }),
      });

      // Non-SSE error responses (e.g. 400 validation errors) come as JSON
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || `Analysis failed: ${response.statusText}`);
        }
        // Unexpected non-stream success — handle gracefully
        const { context } = await response.json();
        set({ context, currentStage: 2, loading: false, loadingMessage: null, progressPercent: 100 });
        return;
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split('\n\n');
        // Keep the last incomplete chunk in the buffer
        buffer = parts.pop() || '';

        for (const part of parts) {
          const dataLine = part.split('\n').find(line => line.startsWith('data: '));
          if (!dataLine) continue;

          const json = dataLine.slice(6); // strip "data: "
          let event: any;
          try {
            event = JSON.parse(json);
          } catch {
            continue;
          }

          if (event.phase === 'complete') {
            const analysisContext = event.result?.context || null;
            // Extract recommendedRounds from deep analysis
            const recommended = analysisContext?.taskAnalysis?.implementationHints?.recommendedRounds;
            const rounds = typeof recommended === 'number'
              ? Math.max(0, Math.min(3, Math.round(recommended)))
              : 3;

            set({
              context: analysisContext,
              maxRounds: rounds,
              currentStage: 2,
              loading: false,
              loadingMessage: null,
              progressPercent: 100,
            });
            return;
          }

          if (event.phase === 'error') {
            set({
              error: event.message || 'Analysis failed',
              loading: false,
              loadingMessage: null,
              progressPercent: 0,
            });
            return;
          }

          // Progress update
          set({
            loadingMessage: event.message || 'Analyzing...',
            progressPercent: event.percent || 0,
          });
        }
      }

      // Stream ended without complete/error event
      if (get().loading) {
        set({ error: 'Analysis stream ended unexpectedly', loading: false, loadingMessage: null, progressPercent: 0 });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        loading: false,
        loadingMessage: null,
        progressPercent: 0,
      });
    }
  },

  /**
   * Updates detected stack information
   * Stays on stage 2 for user review
   */
  editStack: (updates: any) =>
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
  editAnalysis: (updates: any) =>
    set((state) => ({
      context: state.context
        ? {
            ...state.context,
            analysis: { ...state.context.analysis, ...updates },
          }
        : null,
    })),

  /**
   * Updates spec information (legacy - not used in new flow)
   */
  editSpec: () => {
    // Legacy action - no longer used
  },

  /**
   * User confirms context review is complete
   * Creates draft AEC and starts first question round
   */
  confirmContextContinue: async () => {
    const state = get();
    const ticketsState = useTicketsStore.getState();
    if (!state.input.title || !state.input.repoOwner || !state.input.repoName) return;

    set({ loading: true, error: null });

    try {
      // Create draft AEC with adaptive maxRounds
      const createResponse = await authFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: state.input.title,
          description: state.input.description,
          repositoryFullName: `${state.input.repoOwner}/${state.input.repoName}`,
          branchName: state.input.branch || ticketsState.selectedBranch || ticketsState.defaultBranch || 'main',
          maxRounds: state.maxRounds,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create ticket: ${createResponse.statusText}`);
      }

      const aec = await createResponse.json();

      // If maxRounds is 0 (trivial task), auto-finalize: skip questions entirely
      if (state.maxRounds === 0) {
        set({
          draftAecId: aec.id,
          loading: true,
          loadingMessage: 'Trivial task — generating spec directly...',
        });

        try {
          const finalizeResponse = await authFetch(`/tickets/${aec.id}/finalize`, {
            method: 'POST',
          });

          if (!finalizeResponse.ok) {
            throw new Error(`Failed to finalize: ${finalizeResponse.statusText}`);
          }

          const finalizedAec = await finalizeResponse.json();
          set({
            draftAecId: aec.id,
            spec: finalizedAec.techSpec,
            currentStage: 4,
            loading: false,
            loadingMessage: null,
          });
        } catch (finalizeError) {
          // Fallback: if auto-finalize fails, go to stage 3 with maxRounds=1
          console.warn('Auto-finalize failed, falling back to 1 round:', finalizeError);
          set({
            draftAecId: aec.id,
            maxRounds: 1,
            currentStage: 3,
            loading: false,
            loadingMessage: null,
          });
        }
        return;
      }

      set({
        draftAecId: aec.id,
        currentStage: 3,
        loading: false,
      });
      // Stage3Draft component will auto-start the first question round via useEffect
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
  startQuestionRound: async (aecId: string, roundNumber: number) => {
    const state = get();
    // Prevent duplicate calls while already generating
    if (state.roundStatus === 'generating') return;
    set({ roundStatus: 'generating', error: null });

    try {
      const response = await authFetch(`/tickets/${aecId}/start-round`, {
        method: 'POST',
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
  submitRoundAnswers: async (roundNumber: number, answers?: Record<string, string | string[]>) => {
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

      // Use provided answers (from UI component) or fall back to store's round answers
      const finalAnswers = answers || round.answers;

      // Sync answers back to store so they're persisted
      if (answers) {
        const updatedRounds = state.questionRounds.map((r) =>
          r.roundNumber === roundNumber ? { ...r, answers: finalAnswers } : r,
        );
        set({ questionRounds: updatedRounds });
        localStorage.setItem('wizard-question-rounds', JSON.stringify(updatedRounds));
      }

      const response = await authFetch(`/tickets/${state.draftAecId}/submit-answers`, {
        method: 'POST',
        body: JSON.stringify({
          roundNumber,
          answers: finalAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit answers: ${response.statusText}`);
      }

      const { aec, nextAction } = await response.json();

      if (nextAction === 'continue') {
        // Start the next question round
        const nextRound = roundNumber + 1;
        if (nextRound <= get().maxRounds && state.draftAecId) {
          await get().startQuestionRound(state.draftAecId, nextRound);
        } else {
          set({ roundStatus: 'idle' });
        }
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
      const response = await authFetch(`/tickets/${state.draftAecId}/skip-to-finalize`, {
        method: 'POST',
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
      const response = await authFetch(`/tickets/${state.draftAecId}/finalize`, {
        method: 'POST',
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
      const response = await authFetch(`/tickets/${aecId}`);
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
      const response = await authFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: state.input.title,
          description: state.input.description,
          repositoryFullName: state.input.repoOwner && state.input.repoName
            ? `${state.input.repoOwner}/${state.input.repoName}`
            : undefined,
          branchName: state.input.branch,
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
      maxRounds: 3,
      roundStatus: 'idle',
      loading: false,
      loadingMessage: null,
      progressPercent: 0,
      error: null,
    });
  },
}));
