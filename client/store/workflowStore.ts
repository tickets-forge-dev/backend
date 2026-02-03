/**
 * Workflow Store - Phase D
 * 
 * Manages HITL workflow state for ticket generation
 * Subscribes to Firestore for real-time progress updates
 */

import { create } from 'zustand';

export interface Finding {
  id: string;
  category: 'gap' | 'conflict' | 'missing-dependency' | 'architectural-mismatch';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  codeLocation: string | null;
  suggestion: string;
  confidence: number;
  evidence: string;
}

export interface Question {
  id: string;
  text: string;
  context: string;
  defaultAnswer?: string;
}

export interface WorkflowStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
  details?: string;
  error?: string;
}

export type WorkflowState =
  | 'idle'
  | 'generating'
  | 'suspended-findings'
  | 'suspended-questions'
  | 'complete'
  | 'failed';

interface WorkflowStore {
  // State
  aecId: string | null;
  workflowState: WorkflowState;
  currentStep: number;
  totalSteps: number;
  steps: WorkflowStep[];
  findings: Finding[];
  questions: Question[];
  answers: Record<string, string>;
  error: string | null;

  // Real-time subscription
  unsubscribe: (() => void) | null;

  // Actions
  setAecId: (aecId: string) => void;
  setWorkflowState: (state: WorkflowState) => void;
  setSteps: (steps: WorkflowStep[]) => void;
  setCurrentStep: (step: number) => void;
  setFindings: (findings: Finding[]) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setError: (error: string | null) => void;

  // Workflow control
  resumeWorkflow: (action: 'proceed' | 'edit' | 'cancel') => Promise<void>;
  submitAnswers: (answers: Record<string, string>) => Promise<void>;
  skipQuestions: () => Promise<void>;

  // Subscription management
  subscribeToAEC: (aecId: string) => void;
  unsubscribeFromAEC: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  aecId: null,
  workflowState: 'idle' as WorkflowState,
  currentStep: 0,
  totalSteps: 11,
  steps: [],
  findings: [],
  questions: [],
  answers: {},
  error: null,
  unsubscribe: null,
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  ...initialState,

  setAecId: (aecId) => set({ aecId }),

  setWorkflowState: (workflowState) => set({ workflowState }),

  setSteps: (steps) => set({ steps, totalSteps: steps.length }),

  setCurrentStep: (currentStep) => set({ currentStep }),

  setFindings: (findings) => set({ findings }),

  setQuestions: (questions) => set({ questions }),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  setError: (error) => set({ error }),

  resumeWorkflow: async (action) => {
    const { aecId } = get();
    if (!aecId) {
      throw new Error('No AEC ID set');
    }

    try {
      const response = await fetch(`/api/tickets/${aecId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Resume failed: ${response.statusText}`);
      }

      if (action === 'proceed') {
        set({ workflowState: 'generating' });
      } else if (action === 'edit') {
        set({ workflowState: 'idle' });
      } else if (action === 'cancel') {
        set({ workflowState: 'idle' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, workflowState: 'failed' });
      throw error;
    }
  },

  submitAnswers: async (answers) => {
    const { aecId } = get();
    if (!aecId) {
      throw new Error('No AEC ID set');
    }

    try {
      const response = await fetch(`/api/tickets/${aecId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', answers }),
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.statusText}`);
      }

      set({ workflowState: 'generating', answers: {} });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, workflowState: 'failed' });
      throw error;
    }
  },

  skipQuestions: async () => {
    const { aecId } = get();
    if (!aecId) {
      throw new Error('No AEC ID set');
    }

    try {
      const response = await fetch(`/api/tickets/${aecId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });

      if (!response.ok) {
        throw new Error(`Skip failed: ${response.statusText}`);
      }

      set({ workflowState: 'generating' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, workflowState: 'failed' });
      throw error;
    }
  },

  subscribeToAEC: (aecId) => {
    // Unsubscribe from previous if exists
    get().unsubscribeFromAEC();

    set({ aecId });

    // TODO: Implement Firestore real-time subscription
    // const unsubscribe = onSnapshot(
    //   doc(firestore, `aecs/${aecId}`),
    //   (snapshot) => {
    //     const data = snapshot.data();
    //     if (data) {
    //       set({
    //         workflowState: mapStatus(data.status),
    //         steps: data.generationState?.steps || [],
    //         currentStep: data.generationState?.currentStep || 0,
    //         findings: data.preImplementationFindings || [],
    //         questions: data.questions || [],
    //       });
    //     }
    //   }
    // );
    //
    // set({ unsubscribe });
  },

  unsubscribeFromAEC: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },

  reset: () => set(initialState),
}));

/**
 * Helper to map AEC status to workflow state
 */
function mapStatus(status: string): WorkflowState {
  switch (status) {
    case 'draft':
      return 'idle';
    case 'generating':
      return 'generating';
    case 'suspended-findings':
      return 'suspended-findings';
    case 'suspended-questions':
      return 'suspended-questions';
    case 'validated':
    case 'ready':
      return 'complete';
    case 'failed':
      return 'failed';
    default:
      return 'idle';
  }
}
