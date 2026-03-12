import { create } from 'zustand';
import type { ClarificationQuestion, TechSpec, QuestionRound as FrontendQuestionRound, ReproductionStepSpec } from '@/types/question-refinement';
import { useTicketsStore } from '@/stores/tickets.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useTeamStore } from '@/teams/stores/team.store';
import { auth } from '@/lib/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const WIZARD_STORAGE_KEY = 'wizard-snapshot';
const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Named wizard stages — replaces fragile numeric indices.
 * Stage order depends on ticket type (bug adds 'reproduce').
 */
export type WizardStage = 'details' | 'reproduce' | 'codebase' | 'references' | 'options' | 'generate';

const NON_BUG_STAGES: WizardStage[] = ['details', 'codebase', 'references', 'options', 'generate'];
const BUG_STAGES: WizardStage[] = ['details', 'reproduce', 'codebase', 'references', 'options', 'generate'];

export function getStageOrder(type: string): WizardStage[] {
  return type === 'bug' ? BUG_STAGES : NON_BUG_STAGES;
}

/** Map old numeric currentStage to named stage for snapshot backward compatibility */
function migrateNumericStage(numeric: number, type: string): WizardStage {
  if (type === 'bug') {
    // Old bug flow: 1=Input, 2=Repro, 3=Options, 4=Generate
    switch (numeric) {
      case 2: return 'reproduce';
      case 3: return 'options';
      case 4: return 'generate';
      default: return 'details';
    }
  }
  // Old non-bug flow: 1=Input, 2=Options, 3=Generate
  switch (numeric) {
    case 2: return 'options';
    case 3: return 'generate';
    default: return 'details';
  }
}

interface WizardSnapshot {
  currentStage: number | WizardStage; // number for backward compat, WizardStage for new
  input: WizardState['input'];
  type: string;
  priority: string;
  draftAecId: string | null;
  maxRounds: number;
  context: WizardState['context'];
  reproductionSteps: ReproductionStepSpec[];
  timestamp: number;
  includeRepository: boolean; // AC#3: Persist repository inclusion preference
  includeWireframes: boolean;
  wireframeContext: string;
  wireframeImageIds: string[];
  includeApiSpec: boolean;
  apiSpecDeferred: boolean;
  apiContext: string;
}

function saveSnapshot(state: WizardState): void {
  try {
    const snapshot: WizardSnapshot = {
      currentStage: state.currentStage,
      input: state.input,
      type: state.type,
      priority: state.priority,
      draftAecId: state.draftAecId,
      maxRounds: state.maxRounds,
      context: state.context,
      reproductionSteps: state.reproductionSteps,
      timestamp: Date.now(),
      includeRepository: state.includeRepository, // AC#3: Persist repository inclusion
      includeWireframes: state.includeWireframes,
      wireframeContext: state.wireframeContext,
      wireframeImageIds: state.wireframeImageIds,
      includeApiSpec: state.includeApiSpec,
      apiSpecDeferred: state.apiSpecDeferred,
      apiContext: state.apiContext,
    };
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage may be full or unavailable
  }
}

function loadSnapshot(): WizardSnapshot | null {
  try {
    const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const snapshot: WizardSnapshot = JSON.parse(raw);
    // Discard snapshots older than 24h
    if (Date.now() - snapshot.timestamp > SNAPSHOT_TTL_MS) {
      localStorage.removeItem(WIZARD_STORAGE_KEY);
      return null;
    }
    // Migrate numeric currentStage → named WizardStage
    if (typeof snapshot.currentStage === 'number') {
      snapshot.currentStage = migrateNumericStage(snapshot.currentStage, snapshot.type);
    }
    return snapshot;
  } catch {
    return null;
  }
}

/** Resolve named stage to a numeric index for the given type (used by snapshot save) */
function stageToIndex(stage: WizardStage, type: string): number {
  const order = getStageOrder(type);
  const idx = order.indexOf(stage);
  return idx >= 0 ? idx : 0;
}

/**
 * Authenticated fetch wrapper that adds Firebase Bearer token and uses correct API base URL.
 * Matches the auth pattern used by GitHubService's Axios interceptor.
 */
async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const user = auth.currentUser;
  const incomingHeaders = (init?.headers as Record<string, string>) || {};
  const headers: Record<string, string> = { ...incomingHeaders };

  // Only set Content-Type if not explicitly overridden (allows multipart uploads)
  if (!('Content-Type' in headers) && !('content-type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const teamId = useTeamStore.getState().currentTeam?.id;
  if (teamId) {
    headers['x-team-id'] = teamId;
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
  currentStage: WizardStage;
  input: {
    title: string;
    repoOwner: string;
    repoName: string;
    description?: string;
    branch?: string;
  };
  type: string;
  priority: string;

  // AC#3: Repository inclusion flag (default: true for backward compatibility)
  includeRepository: boolean;

  // Epic 14: Generation options
  includeWireframes: boolean;
  wireframeContext: string;
  wireframeImageIds: string[];
  includeApiSpec: boolean;
  apiSpecDeferred: boolean;
  apiContext: string;

  // Folder assignment (optional — ticket goes to feed if null)
  folderId: string | null;

  // Bug reproduction steps (user-provided, optional)
  reproductionSteps: ReproductionStepSpec[];

  context: {
    stack: any;
    analysis: any;
    files: FileEntry[];
    taskAnalysis: TaskAnalysis | null;
  } | null;
  spec: TechSpec | null;
  answers: Record<string, string | string[]>; // Legacy: Clarification question answers

  // File uploads (staged before draft creation)
  pendingFiles: File[];

  // Design references (staged before draft creation)
  pendingDesignLinks: Array<{
    url: string;
    title?: string;
    tempId: string; // For local tracking
  }>;

  // Simplified question refinement (NEW - single set, no rounds)
  draftAecId: string | null;
  clarificationQuestions: ClarificationQuestion[];
  questionAnswers: Record<string, string | string[]>;

  // Legacy iterative refinement workflow (deprecated)
  questionRounds: QuestionRound[];
  currentRound: number;
  maxRounds: number;
  roundStatus: 'idle' | 'generating' | 'answering' | 'submitting' | 'finalizing';
  loading: boolean;
  loadingMessage: string | null;
  progressPercent: number;
  currentPhase: string | null; // Current analysis phase (e.g., 'connecting', 'analyzing', etc.)
  hasRepository: boolean; // Whether repository is being analyzed (for progress UI)
  error: string | null;

  // First ticket celebration
  showCelebration: boolean;
}

/**
 * Recovery info returned by tryRecover
 */
export interface RecoveryInfo {
  canRecover: boolean;
  stage: WizardStage;
  title: string;
}

/**
 * Wizard actions
 */
export interface WizardActions {
  // Input stage
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setRepository: (owner: string, name: string) => void;
  setType: (type: string) => void;
  setPriority: (priority: string) => void;
  setIncludeRepository: (include: boolean) => void; // AC#3: Toggle repository inclusion
  setIncludeWireframes: (include: boolean) => void;
  setWireframeContext: (context: string) => void;
  addWireframeImage: (imageId: string) => void;
  removeWireframeImage: (imageId: string) => void;
  setIncludeApiSpec: (include: boolean) => void;
  setApiSpecDeferred: (deferred: boolean) => void;
  setApiContext: (context: string) => void;
  setFolderId: (folderId: string | null) => void;

  // Bug reproduction steps
  addReproductionStep: () => void;
  updateReproductionStep: (index: number, updates: Partial<ReproductionStepSpec>) => void;
  removeReproductionStep: (index: number) => void;

  // Context stage
  analyzeRepository: () => Promise<void>;
  editStack: (updates: any) => void; // Legacy: ProjectStack type
  editAnalysis: (updates: any) => void; // Legacy: CodebaseAnalysis type

  // File uploads
  addPendingFile: (file: File) => void;
  removePendingFile: (index: number) => void;

  // Design references
  addPendingDesignLink: (url: string, title?: string) => void;
  removePendingDesignLink: (tempId: string) => void;

  // Draft stage
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  editSpec: (section: string, updates: any) => void;
  confirmContextContinue: () => Promise<void>;  // Creates draft AEC and generates initial spec
  confirmSpecContinue: () => void;

  // Recovery
  tryRecover: () => RecoveryInfo;
  applyRecovery: () => Promise<void>;

  // Simplified question refinement workflow (NEW - replaces multi-round)
  generateQuestions: () => Promise<void>;
  submitQuestionAnswers: () => Promise<void>;

  // Legacy iterative refinement workflow (deprecated, kept for compatibility)
  startQuestionRound: (aecId: string, roundNumber: number) => Promise<void>;
  answerQuestionInRound: (round: number, questionId: string, answer: string | string[]) => void;
  submitRoundAnswers: (roundNumber: number, answers?: Record<string, string | string[]>) => Promise<'continue' | 'finalize'>;
  skipToFinalize: () => Promise<void>;
  finalizeSpec: () => Promise<void>;
  resumeDraft: (aecId: string) => Promise<void>;

  // Navigation
  goToStage: (stage: WizardStage) => void;
  nextStage: () => void;
  prevStage: () => void;
  // Legacy aliases (used by existing components)
  goToGenerationOptions: () => void;
  goToReproSteps: () => void;
  goBackToInput: () => void;
  goBackToContext: () => void;
  goBackToSpec: () => void;

  // Error handling
  setError: (error: string | null) => void;
  reset: () => void;

  // Review stage
  createTicket: () => Promise<void>;

  // Celebration
  closeCelebration: () => void;
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

  currentStage: 'details' as WizardStage,
  input: {
    title: '',
    repoOwner: '',
    repoName: '',
  },
  type: 'feature',
  priority: 'low',
  // AC#3: Default based on GitHub connection status
  // If GitHub not connected, default to false (PMs without GitHub shouldn't see repo as default)
  // If GitHub connected, default to true (backward compatibility for developers)
  includeRepository: useSettingsStore.getState().githubConnected,
  includeWireframes: true,
  wireframeContext: '',
  wireframeImageIds: [],
  includeApiSpec: true,
  apiSpecDeferred: false,
  apiContext: '',
  folderId: null,
  reproductionSteps: [],
  context: null,
  spec: null,
  answers: {},
  pendingFiles: [],
  pendingDesignLinks: [],
  draftAecId: null,
  clarificationQuestions: [],
  questionAnswers: {},
  questionRounds: [],
  currentRound: 0,
  maxRounds: 3,
  roundStatus: 'idle',
  loading: false,
  loadingMessage: null,
  progressPercent: 0,
  currentPhase: null,
  hasRepository: false,
  error: null,
  showCelebration: false,

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

  // File upload actions
  addPendingFile: (file: File) =>
    set((state) => ({
      pendingFiles: [...state.pendingFiles, file],
    })),

  removePendingFile: (index: number) =>
    set((state) => ({
      pendingFiles: state.pendingFiles.filter((_, i) => i !== index),
    })),

  // Design link actions
  addPendingDesignLink: (url: string, title?: string) =>
    set((state) => {
      // Validate URL before adding
      if (!url || !url.startsWith('https://')) {
        console.warn('Invalid design link URL:', url);
        return state;
      }

      // Check for duplicates
      if (state.pendingDesignLinks.some((link) => link.url === url)) {
        console.warn('Design link already exists:', url);
        return state;
      }

      return {
        pendingDesignLinks: [
          ...state.pendingDesignLinks,
          {
            url,
            title,
            tempId: `design_${crypto.randomUUID()}`,
          },
        ],
      };
    }),

  removePendingDesignLink: (tempId: string) =>
    set((state) => ({
      pendingDesignLinks: state.pendingDesignLinks.filter((link) => link.tempId !== tempId),
    })),

  setRepository: (owner: string, name: string) =>
    set((state) => ({
      input: { ...state.input, repoOwner: owner, repoName: name },
    })),

  setType: (type: string) => set({
    type,
    includeWireframes: type === 'feature',
    includeApiSpec: type === 'feature',
    apiSpecDeferred: false,
    wireframeContext: '',
    wireframeImageIds: [],
    apiContext: '',
  }),

  setPriority: (priority: string) => set({ priority }),

  // AC#3: Toggle repository inclusion
  setIncludeRepository: (include: boolean) => set({ includeRepository: include }),

  // Epic 14: Generation options actions
  setIncludeWireframes: (include: boolean) => set(include
    ? { includeWireframes: true }
    : { includeWireframes: false, wireframeContext: '', wireframeImageIds: [] },
  ),
  setWireframeContext: (context: string) => set({ wireframeContext: context }),
  addWireframeImage: (imageId: string) => set((state) => ({
    wireframeImageIds: [...state.wireframeImageIds, imageId],
  })),
  removeWireframeImage: (imageId: string) => set((state) => ({
    wireframeImageIds: state.wireframeImageIds.filter((id) => id !== imageId),
  })),
  setIncludeApiSpec: (include: boolean) => set(include
    ? { includeApiSpec: true, apiSpecDeferred: false }
    : { includeApiSpec: false, apiSpecDeferred: false, apiContext: '' },
  ),
  setApiSpecDeferred: (deferred: boolean) => set({ apiSpecDeferred: deferred, includeApiSpec: !deferred }),
  setApiContext: (context: string) => set({ apiContext: context }),

  setFolderId: (folderId: string | null) => set({ folderId }),

  // Bug reproduction steps
  addReproductionStep: () =>
    set((state) => {
      const nextOrder = state.reproductionSteps.length + 1;
      return {
        reproductionSteps: [
          ...state.reproductionSteps,
          { order: nextOrder, action: '' },
        ],
      };
    }),

  updateReproductionStep: (index: number, updates: Partial<ReproductionStepSpec>) =>
    set((state) => ({
      reproductionSteps: state.reproductionSteps.map((step, i) =>
        i === index ? { ...step, ...updates } : step
      ),
    })),

  removeReproductionStep: (index: number) =>
    set((state) => ({
      reproductionSteps: state.reproductionSteps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i + 1 })),
    })),

  // ============================================================================
  // RECOVERY
  // ============================================================================

  /**
   * Check if wizard state can be recovered from localStorage snapshot.
   * Does NOT mutate store state — only returns info so the UI can show a banner.
   * Actual state restoration happens when the user clicks Resume (via applyRecovery).
   */
  tryRecover: () => {
    const noRecovery: RecoveryInfo = { canRecover: false, stage: 'details', title: '' };

    // Don't recover if wizard already has progress
    const state = get();
    if (state.currentStage !== 'details' || state.input.title) return noRecovery;

    const snapshot = loadSnapshot();
    if (!snapshot) return noRecovery;

    // Resolve stage (loadSnapshot already migrates numeric → named)
    const stage = snapshot.currentStage as WizardStage;

    // Has draftAecId — recover to wherever they were
    if (snapshot.draftAecId) {
      return {
        canRecover: true,
        stage,
        title: snapshot.input.title,
      };
    }

    // Has context — recover to generate stage
    if (snapshot.context) {
      return {
        canRecover: true,
        stage: 'generate',
        title: snapshot.input.title,
      };
    }

    // Bug reproduce step
    if (stage === 'reproduce' && snapshot.type === 'bug') {
      return {
        canRecover: true,
        stage: 'reproduce',
        title: snapshot.input.title,
      };
    }

    // Has form data — recover to whatever stage they were on (or details)
    if (snapshot.input.title) {
      return {
        canRecover: true,
        stage: stage || 'details',
        title: snapshot.input.title,
      };
    }

    return noRecovery;
  },

  /**
   * Apply recovery from localStorage snapshot.
   * Called when user clicks "Resume" on the recovery banner.
   * For Stage 3+ (draftAecId), delegates to resumeDraft for backend-first recovery.
   */
  applyRecovery: async () => {
    const snapshot = loadSnapshot();
    if (!snapshot) return;

    // Stage 3+ with draftAecId — delegate to backend-first recovery
    if (snapshot.draftAecId) {
      await get().resumeDraft(snapshot.draftAecId);
      return;
    }

    // Resolve stage (loadSnapshot already migrates numeric → named)
    const stage = snapshot.currentStage as WizardStage;

    // Common fields to restore
    const commonFields = {
      input: snapshot.input,
      type: snapshot.type,
      priority: snapshot.priority,
      reproductionSteps: snapshot.reproductionSteps ?? [],
      includeRepository: snapshot.includeRepository ?? true,
      includeWireframes: snapshot.includeWireframes ?? true,
      wireframeContext: snapshot.wireframeContext ?? '',
      wireframeImageIds: snapshot.wireframeImageIds ?? [],
      includeApiSpec: snapshot.includeApiSpec ?? true,
      apiSpecDeferred: snapshot.apiSpecDeferred ?? false,
      apiContext: snapshot.apiContext ?? '',
    };

    // Has context — go to generate stage
    if (snapshot.context) {
      set({
        ...commonFields,
        currentStage: 'generate' as WizardStage,
        maxRounds: snapshot.maxRounds,
        context: snapshot.context,
      });
      return;
    }

    // Restore to whatever stage they were on
    if (snapshot.input.title) {
      set({
        ...commonFields,
        currentStage: stage || ('details' as WizardStage),
      });
    }
  },

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
    if (state.loading) return; // Guard against double-click / concurrent SSE streams
    const ticketsState = useTicketsStore.getState();

    // Determine if repository is being analyzed
    const hasRepo = !!(state.input.repoOwner && state.input.repoName && state.input.repoOwner !== '' && state.input.repoName !== '');

    // Draft stage is always 'generate' (last stage in the flow)
    const draftStage: WizardStage = 'generate';

    // If no repository, skip analysis and go directly to Draft stage
    if (!hasRepo) {
      set({
        loading: true,
        loadingMessage: 'Preparing ticket...',
        progressPercent: 50,
        currentPhase: 'preparing',
        hasRepository: false,
        error: null,
      });

      // Simulate brief loading for UX smoothness
      await new Promise(resolve => setTimeout(resolve, 800));

      set({
        context: null, // No repository context
        currentStage: draftStage,
        loading: false,
        loadingMessage: null,
        progressPercent: 100,
        currentPhase: 'complete',
      });
      saveSnapshot(get());
      return;
    }

    set({
      loading: true,
      loadingMessage: 'Connecting to GitHub...',
      progressPercent: 0,
      currentPhase: 'connecting',
      hasRepository: hasRepo,
      error: null
    });

    try {
      const branch = ticketsState.selectedBranch || ticketsState.defaultBranch || 'main';

      // Resolve owner/repo: prefer wizard store, fall back to tickets store
      let owner = state.input.repoOwner;
      let repo = state.input.repoName;
      if ((!owner || !repo) && ticketsState.selectedRepository) {
        const [o, r] = ticketsState.selectedRepository.split('/');
        owner = o || owner;
        repo = r || repo;
        // Sync back to wizard store so subsequent calls are consistent
        if (o && r) set((s) => ({ input: { ...s.input, repoOwner: o, repoName: r } }));
      }

      const response = await authFetch('/tickets/analyze-repo', {
        method: 'POST',
        body: JSON.stringify({
          owner,
          repo,
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
        set({ context, currentStage: draftStage, loading: false, loadingMessage: null, progressPercent: 100 });
        saveSnapshot(get());
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
              currentStage: draftStage,
              loading: false,
              loadingMessage: null,
              progressPercent: 100,
              currentPhase: 'complete',
            });
            saveSnapshot(get());
            return;
          }

          if (event.phase === 'error') {
            set({
              error: event.message || 'Analysis failed',
              loading: false,
              loadingMessage: null,
              progressPercent: 0,
              currentPhase: null,
            });
            return;
          }

          // Progress update
          set({
            currentPhase: event.phase || null,
            loadingMessage: event.message || 'Analyzing...',
            progressPercent: event.percent || 0,
          });
        }
      }

      // Stream ended without complete/error event
      if (get().loading) {
        set({ error: 'Analysis stream ended unexpectedly', loading: false, loadingMessage: null, progressPercent: 0, currentPhase: null });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        loading: false,
        loadingMessage: null,
        progressPercent: 0,
        currentPhase: null,
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
    if (state.loading) return; // Guard against double-click
    const ticketsState = useTicketsStore.getState();

    // Resolve owner/repo with fallback to tickets store
    const repoOwner = state.input.repoOwner || ticketsState.selectedRepository?.split('/')[0] || '';
    const repoName = state.input.repoName || ticketsState.selectedRepository?.split('/')[1] || '';

    // Validate required fields (repository only required if hasRepository is true)
    if (!state.input.title) {
      set({ error: 'Missing required field: title', loading: false });
      return;
    }

    if (state.hasRepository && (!repoOwner || !repoName)) {
      const missing = [];
      if (!repoOwner) missing.push('repository owner');
      if (!repoName) missing.push('repository name');
      set({ error: `Missing required fields: ${missing.join(', ')}`, loading: false });
      return;
    }

    set({ loading: true, error: null, currentPhase: 'preparing', loadingMessage: 'Creating ticket...', progressPercent: 0 });

    try {
      // Build request body (only include repository fields if we have a repository)
      const requestBody: any = {
        title: state.input.title,
        description: state.input.description,
        type: state.type,
        priority: state.priority,
        maxRounds: state.maxRounds,
        taskAnalysis: state.context?.taskAnalysis ?? undefined,
      };

      // Include generation options
      requestBody.includeWireframes = state.includeWireframes;
      if (state.includeWireframes && state.wireframeContext) {
        requestBody.wireframeContext = state.wireframeContext;
      }
      if (state.includeWireframes && state.wireframeImageIds.length > 0) {
        requestBody.wireframeImageAttachmentIds = state.wireframeImageIds;
      }
      requestBody.includeApiSpec = state.apiSpecDeferred ? false : state.includeApiSpec;
      requestBody.apiSpecDeferred = state.apiSpecDeferred;
      if (state.includeApiSpec && !state.apiSpecDeferred && state.apiContext) {
        requestBody.apiContext = state.apiContext;
      }

      // Include user-provided reproduction steps for bug tickets
      if (state.type === 'bug' && state.reproductionSteps.length > 0) {
        const validSteps = state.reproductionSteps.filter(s => s.action.trim());
        if (validSteps.length > 0) {
          requestBody.reproductionSteps = validSteps;
        }
      }

      // Only include repository fields if we have a repository
      if (state.hasRepository && repoOwner && repoName) {
        requestBody.repositoryFullName = `${repoOwner}/${repoName}`;
        requestBody.branchName = state.input.branch || ticketsState.selectedBranch || ticketsState.defaultBranch || 'main';
      }

      // Create draft AEC with adaptive maxRounds + taskAnalysis from deep analysis
      const createResponse = await authFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create ticket: ${createResponse.statusText}`);
      }

      const aec = await createResponse.json();

      // Move ticket to folder if one was selected (use state captured at function start)
      const selectedFolderId = state.folderId;
      if (selectedFolderId) {
        try {
          const teamId = useTeamStore.getState().currentTeam?.id;
          if (teamId) {
            await authFetch(`/teams/${teamId}/folders/move-ticket/${aec.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ folderId: selectedFolderId }),
            });
          }
        } catch (moveError) {
          console.warn('Failed to move ticket to folder:', moveError);
        }
      }

      // If maxRounds is 0 (trivial task), auto-finalize: skip questions entirely
      if (state.maxRounds === 0) {
        set({
          draftAecId: aec.id,
          loading: true,
          loadingMessage: 'Trivial task — generating spec directly...',
        });
        saveSnapshot(get());

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
            currentStage: 'generate' as WizardStage,
            loading: false,
            loadingMessage: null,
          });
        } catch (finalizeError) {
          // Fallback: if auto-finalize fails, go to stage 3 with maxRounds=1
          console.warn('Auto-finalize failed, falling back to 1 round:', finalizeError);
          set({
            draftAecId: aec.id,
            maxRounds: 1,
            currentStage: 'generate' as WizardStage,
            loading: false,
            loadingMessage: null,
          });
        }
        return;
      }

      set({
        draftAecId: aec.id,
        currentStage: 'generate' as WizardStage,
        loading: false,
      });

      // Upload pending files in background (best-effort, don't block wizard)
      // Use state captured at function start to avoid stale reads
      const filesToUpload = state.pendingFiles;
      if (filesToUpload.length > 0) {
        set({ pendingFiles: [] });
        for (const file of filesToUpload) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            // Use native fetch for multipart — authFetch would add Content-Type
            const uploadUser = auth.currentUser;
            const uploadHeaders: Record<string, string> = {};
            if (uploadUser) {
              uploadHeaders['Authorization'] = `Bearer ${await uploadUser.getIdToken()}`;
            }
            await fetch(`${API_URL}/tickets/${aec.id}/attachments`, {
              method: 'POST',
              headers: uploadHeaders,
              body: formData,
            });
          } catch (uploadError) {
            console.warn('Failed to upload file:', file.name, uploadError);
          }
        }
      }

      // Upload pending design references in background (best-effort, don't block wizard)
      const linksToUpload = state.pendingDesignLinks;
      if (linksToUpload.length > 0) {
        const failedLinks: typeof linksToUpload = [];

        for (const link of linksToUpload) {
          try {
            const response = await authFetch(`/tickets/${aec.id}/design-references`, {
              method: 'POST',
              body: JSON.stringify({
                url: link.url,
                title: link.title,
              }),
            });

            if (!response.ok) {
              console.warn(`Failed to upload design link (${response.status}):`, link.url);
              failedLinks.push(link);
            }
          } catch (uploadError) {
            console.warn('Failed to upload design link:', link.url, uploadError);
            failedLinks.push(link);
          }
        }

        // Clear successfully uploaded links, keep failed ones for retry
        if (failedLinks.length < linksToUpload.length) {
          set({ pendingDesignLinks: failedLinks });
        } else {
          // All failed or all succeeded - only clear if all succeeded
          if (failedLinks.length === 0) {
            set({ pendingDesignLinks: [] });
          }
        }

        if (failedLinks.length > 0) {
          console.warn(`${failedLinks.length} design links failed to upload, kept for retry`);
        }
      }

      saveSnapshot(get());
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
    set((state) => {
      const updates: any = {
        answers: {
          ...state.answers,
          [questionId]: answer,
        },
      };

      // Also update questionAnswers for simplified flow
      if (state.clarificationQuestions.length > 0) {
        updates.questionAnswers = {
          ...state.questionAnswers,
          [questionId]: answer,
        };
        // Auto-save to localStorage
        localStorage.setItem('wizard-question-answers', JSON.stringify(updates.questionAnswers));
      }

      return updates;
    }),

  /**
   * User confirms draft review is complete
   * Advances to stage 4 (final review)
   */
  confirmSpecContinue: () =>
    set({
      currentStage: 'generate' as WizardStage,
    }),

  // ============================================================================
  // SIMPLIFIED QUESTION REFINEMENT WORKFLOW (NEW - Single Set, No Rounds)
  // ============================================================================

  /**
   * Generate clarification questions (up to 5, single call)
   * Calls backend to generate context-aware questions based on codebase
   */
  generateQuestions: async () => {
    const state = get();
    if (!state.draftAecId) {
      set({ error: 'No draft AEC found' });
      return;
    }

    if (state.roundStatus === 'generating') return; // Prevent duplicate calls
    set({ roundStatus: 'generating', error: null });

    try {
      const response = await authFetch(`/tickets/${state.draftAecId}/generate-questions`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.statusText}`);
      }

      const { questions } = await response.json();
      set({
        clarificationQuestions: questions,
        roundStatus: 'idle',
        currentStage: 'generate' as WizardStage,
      });

      // Auto-save to localStorage
      localStorage.setItem('wizard-clarification-questions', JSON.stringify(questions));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        roundStatus: 'idle',
      });
    }
  },

  /**
   * Submit all question answers and finalize spec
   * Combines answer submission + spec generation in one call
   */
  submitQuestionAnswers: async () => {
    const state = get();
    if (!state.draftAecId) {
      set({ error: 'No draft AEC found' });
      return;
    }

    set({ roundStatus: 'submitting', error: null });

    try {
      const response = await authFetch(`/tickets/${state.draftAecId}/submit-answers`, {
        method: 'POST',
        body: JSON.stringify({ answers: state.questionAnswers }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit answers: ${response.statusText}`);
      }

      const data = await response.json();

      // Update state with finalized spec — stay on Stage 3 for user review
      set({
        spec: data.techSpec,
        roundStatus: 'idle',
      });

      // Clear localStorage
      localStorage.removeItem('wizard-clarification-questions');
      localStorage.removeItem('wizard-question-answers');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: errorMessage,
        roundStatus: 'idle',
      });
    }
  },

  // ============================================================================
  // LEGACY ITERATIVE REFINEMENT WORKFLOW (Deprecated - kept for compatibility)
  // ============================================================================

  /**
   * LEGACY: Start a new question round
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
        currentStage: 'generate' as WizardStage, // Ensure we're on stage 3
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

      // Check if this is the user's first ticket
      const hasCompletedFirstTicket = localStorage.getItem('forge-first-ticket-completed');
      const shouldShowCelebration = !hasCompletedFirstTicket;

      set({
        spec: aec.techSpec,
        roundStatus: 'idle',
        showCelebration: shouldShowCelebration,
      });

      // Mark first ticket as completed
      if (shouldShowCelebration) {
        localStorage.setItem('forge-first-ticket-completed', 'true');
      }

      // Clear localStorage draft
      localStorage.removeItem('wizard-draft-aec-id');
      localStorage.removeItem('wizard-question-rounds');
      localStorage.removeItem('wizard-current-round');
      localStorage.removeItem(WIZARD_STORAGE_KEY);
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

      // Parse repo owner/name from repositoryFullName (e.g. "owner/repo")
      const repoParts = (aec.repositoryFullName || '').split('/');
      const repoOwner = repoParts[0] || '';
      const repoName = repoParts[1] || '';

      // Determine the right stage: if the draft has questions/rounds, resume at generate;
      // otherwise (e.g. quick draft with just a title), start at details
      const hasProgress = (aec.questions && aec.questions.length > 0) ||
        (aec.questionRounds && aec.questionRounds.length > 0) ||
        aec.currentRound > 0;
      const resumeStage: WizardStage = hasProgress ? 'generate' : 'details';

      set({
        draftAecId: aecId,
        // New simplified question fields
        clarificationQuestions: aec.questions || [],
        questionAnswers: aec.questionAnswers || {},
        // Legacy round-based fields
        questionRounds: aec.questionRounds || [],
        currentRound: aec.currentRound || 0,
        maxRounds: aec.maxRounds ?? get().maxRounds,
        type: aec.type || get().type,
        priority: aec.priority || get().priority,
        currentStage: resumeStage,
        input: {
          title: aec.title,
          repoOwner,
          repoName,
          description: aec.description || '',
        },
        loading: false,
      });

      // Restore localStorage
      localStorage.setItem('wizard-draft-aec-id', aecId);
      localStorage.setItem('wizard-clarification-questions', JSON.stringify(aec.questions || []));
      localStorage.setItem('wizard-question-answers', JSON.stringify(aec.questionAnswers || {}));
      localStorage.setItem('wizard-question-rounds', JSON.stringify(aec.questionRounds || []));
      localStorage.setItem('wizard-current-round', String(aec.currentRound || 0));
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

  goToStage: (stage: WizardStage) => {
    if (get().loading) return;
    set({ currentStage: stage, error: null });
    saveSnapshot(get());
  },

  nextStage: () => {
    const state = get();
    if (state.loading) return;
    const order = getStageOrder(state.type);
    const idx = order.indexOf(state.currentStage);
    if (idx < order.length - 1) {
      set({ currentStage: order[idx + 1], error: null });
      saveSnapshot(get());
    }
  },

  prevStage: () => {
    const state = get();
    if (state.loading) return;
    const order = getStageOrder(state.type);
    const idx = order.indexOf(state.currentStage);
    if (idx > 0) {
      set({ currentStage: order[idx - 1], error: null });
      saveSnapshot(get());
    }
  },

  // Legacy aliases — delegate to goToStage/prevStage
  goToGenerationOptions: () => {
    get().goToStage('options');
  },

  goToReproSteps: () => {
    get().goToStage('reproduce');
  },

  goBackToInput: () => {
    get().goToStage('details');
  },

  goBackToContext: () => {
    get().prevStage();
  },

  goBackToSpec: () => {
    get().goToStage('generate');
  },

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
    localStorage.removeItem('wizard-clarification-questions');
    localStorage.removeItem('wizard-question-answers');
    localStorage.removeItem(WIZARD_STORAGE_KEY);

    set({
      currentStage: 'details' as WizardStage,
      input: {
        title: '',
        repoOwner: '',
        repoName: '',
        description: undefined,
        branch: undefined,
      },
      type: 'feature',
      priority: 'low',
      includeRepository: true, // AC#3: Reset to default (true)
      includeWireframes: true,
      wireframeContext: '',
      wireframeImageIds: [],
      includeApiSpec: true,
      apiSpecDeferred: false,
      apiContext: '',
      folderId: null,
      reproductionSteps: [],
      context: null,
      spec: null,
      answers: {},
      pendingFiles: [],
      pendingDesignLinks: [],
      draftAecId: null,
      clarificationQuestions: [],
      questionAnswers: {},
      questionRounds: [],
      currentRound: 0,
      maxRounds: 3,
      roundStatus: 'idle',
      loading: false,
      loadingMessage: null,
      progressPercent: 0,
      currentPhase: null,
      hasRepository: false,
      error: null,
      showCelebration: false,
    });
  },

  closeCelebration: () => {
    set({ showCelebration: false });
  },
}));
