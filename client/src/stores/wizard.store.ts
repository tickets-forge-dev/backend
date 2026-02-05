/**
 * Wizard Store
 * Manages state for the 4-stage ticket creation wizard
 *
 * Stages:
 * 1 = Input (title + repo selection)
 * 2 = Context (GitHub code analysis)
 * 3 = Draft (problem/solution + questions)
 * 4 = Final Review (quality score + create ticket)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GitHubContext {
  stack?: {
    framework?: { name: string; version?: string } | null;
    language?: { name: string; version?: string };
    packageManager?: { type: string };
    dependencies?: string[];
    devDependencies?: string[];
    tooling?: Record<string, string>;
    hasWorkspaces?: boolean;
    isMonorepo?: boolean;
  };
  analysis?: {
    architecture?: { type: string; confidence: number; signals: string[]; directories: string[] };
    naming?: Record<string, string>;
    testing?: Record<string, string>;
    stateManagement?: Record<string, unknown>;
    apiRouting?: Record<string, string>;
    directories?: string[];
    overallConfidence?: number;
    recommendations?: string[];
  };
  fileTree?: any;
  files?: Record<string, string>;
}

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  description?: string;
}

export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

export interface DraftData {
  problem?: string;
  solution?: string[];
  inScope?: string[];
  outOfScope?: string[];
  acceptanceCriteria?: AcceptanceCriterion[];
  clarificationQuestions?: any[];
  fileChanges?: FileChange[];
  qualityScore?: number;
}

export interface WizardState {
  // Current stage (1-4)
  currentStage: 1 | 2 | 3 | 4;

  // Stage 1: Input
  title: string;
  selectedRepository?: { id: number; fullName: string; name: string; owner: string };
  selectedBranch?: string;

  // Stage 2: Context
  githubContext?: GitHubContext;
  isAnalyzingCode: boolean;
  analysisError?: string;

  // Stage 3: Draft
  draftData: DraftData;
  currentQuestionRound: number;
  questionRounds: any[];
  isDraft: boolean;

  // Stage 4: Final Review
  finalSpec?: any;
  isCreatingTicket: boolean;
  creationError?: string;

  // General
  isLoading: boolean;
  error?: string;

  // Actions
  setStage: (stage: 1 | 2 | 3 | 4) => void;
  nextStage: () => void;
  previousStage: () => void;
  setTitle: (title: string) => void;
  setRepository: (repo: { id: number; fullName: string; name: string; owner: string }) => void;
  setBranch: (branch: string) => void;
  setGitHubContext: (context: GitHubContext) => void;
  setIsAnalyzingCode: (isAnalyzing: boolean) => void;
  setAnalysisError: (error?: string) => void;
  setDraftData: (data: Partial<DraftData>) => void;
  setQuestionRounds: (rounds: any[]) => void;
  setCurrentQuestionRound: (round: number) => void;
  setFinalSpec: (spec: any) => void;
  setIsCreatingTicket: (isCreating: boolean) => void;
  setCreationError: (error?: string) => void;
  setError: (error?: string) => void;
  reset: () => void;
}

const initialState = {
  currentStage: 1 as const,
  title: '',
  selectedRepository: undefined,
  selectedBranch: 'main',
  githubContext: undefined,
  isAnalyzingCode: false,
  analysisError: undefined,
  draftData: {},
  currentQuestionRound: 0,
  questionRounds: [],
  isDraft: false,
  finalSpec: undefined,
  isCreatingTicket: false,
  creationError: undefined,
  isLoading: false,
  error: undefined,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,

      setStage: (stage) => set({ currentStage: stage }),

      nextStage: () =>
        set((state) => ({
          currentStage: Math.min(4, state.currentStage + 1) as 1 | 2 | 3 | 4,
        })),

      previousStage: () =>
        set((state) => ({
          currentStage: Math.max(1, state.currentStage - 1) as 1 | 2 | 3 | 4,
        })),

      setTitle: (title) => set({ title }),

      setRepository: (repo) => set({ selectedRepository: repo }),

      setBranch: (branch) => set({ selectedBranch: branch }),

      setGitHubContext: (context) => set({ githubContext: context }),

      setIsAnalyzingCode: (isAnalyzing) => set({ isAnalyzingCode: isAnalyzing }),

      setAnalysisError: (error) => set({ analysisError: error }),

      setDraftData: (data) =>
        set((state) => ({
          draftData: { ...state.draftData, ...data },
        })),

      setQuestionRounds: (rounds) => set({ questionRounds: rounds }),

      setCurrentQuestionRound: (round) => set({ currentQuestionRound: round }),

      setFinalSpec: (spec) => set({ finalSpec: spec }),

      setIsCreatingTicket: (isCreating) => set({ isCreatingTicket: isCreating }),

      setCreationError: (error) => set({ creationError: error }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'wizard-draft', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        currentStage: state.currentStage,
        title: state.title,
        selectedRepository: state.selectedRepository,
        selectedBranch: state.selectedBranch,
        githubContext: state.githubContext,
        draftData: state.draftData,
        currentQuestionRound: state.currentQuestionRound,
        questionRounds: state.questionRounds,
      }),
    }
  )
);
