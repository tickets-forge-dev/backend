import { create } from 'zustand';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface GenerationStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
  details?: string;
  error?: string;
}

export interface Finding {
  id: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  codeLocation: string | null;
  suggestion: string;
  confidence: number;
  evidence: string;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  context: string;
  defaultAnswer: string;
}

export type WorkflowState = 'idle' | 'generating' | 'suspended-findings' | 'suspended-questions' | 'complete' | 'failed';

interface WorkflowStoreState {
  // Workflow state
  workflowState: WorkflowState;
  currentStep: number;
  totalSteps: number;
  steps: GenerationStep[];

  // Suspension points
  findings: Finding[];
  questions: Question[];
  answers: Record<string, string>;

  // Error handling
  error: string | null;
  isRetrying: boolean;

  // Real-time subscriptions
  subscriptionRef: Unsubscribe | null;

  // Actions
  startWorkflow: (aecId: string, workspaceId: string) => Promise<void>;
  subscribeToAEC: (aecId: string, workspaceId: string) => void;
  unsubscribeFromAEC: () => void;

  // Suspension point handlers
  resumeFromFindingsReview: (action: 'proceed' | 'edit' | 'cancel') => Promise<void>;
  submitQuestionAnswers: (answers: Record<string, string>) => Promise<void>;
  skipQuestions: () => Promise<void>;

  // Error handling
  retryStep: (stepId: number) => Promise<void>;
  clearError: () => void;

  // State management
  setAnswers: (answers: Record<string, string>) => void;
  reset: () => void;
}

const initialState = {
  workflowState: 'idle' as WorkflowState,
  currentStep: 0,
  totalSteps: 12,
  steps: [],
  findings: [],
  questions: [],
  answers: {},
  error: null,
  isRetrying: false,
  subscriptionRef: null,
};

export const useWorkflowStore = create<WorkflowStoreState>((set, get) => ({
  ...initialState,

  // Subscribe to real-time Firestore updates
  subscribeToAEC: (aecId: string, workspaceId: string) => {
    console.log('📡 [WorkflowStore] Subscribing to AEC:', aecId);

    // Unsubscribe from any existing subscription
    const { subscriptionRef } = get();
    if (subscriptionRef) {
      subscriptionRef();
    }

    const aecRef = doc(firestore, `workspaces/${workspaceId}/aecs/${aecId}`);

    const unsubscribe = onSnapshot(
      aecRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // Map AEC status to workflow state
          const statusMap: Record<string, WorkflowState> = {
            GENERATING: 'generating',
            SUSPENDED_FINDINGS: 'suspended-findings',
            SUSPENDED_QUESTIONS: 'suspended-questions',
            VALIDATED: 'complete',
            FAILED: 'failed',
          };

          const workflowState = statusMap[data.status] || 'idle';

          // Parse generation state from Firestore
          const generationState = data.generationState || {};
          const steps = generationState.steps || [];

          set({
            workflowState,
            currentStep: generationState.currentStep || 0,
            steps,
            findings: data.preImplementationFindings || [],
            questions: data.questions || [],
            error: data.failureReason || null,
          });

          console.log('📡 [WorkflowStore] AEC updated:', { workflowState, currentStep: generationState.currentStep });
        }
      },
      (error) => {
        console.error('❌ [WorkflowStore] Firestore subscription error:', error);
        set({ error: 'Failed to subscribe to workflow updates' });
      }
    );

    set({ subscriptionRef: unsubscribe });
  },

  unsubscribeFromAEC: () => {
    const { subscriptionRef } = get();
    if (subscriptionRef) {
      console.log('🔴 [WorkflowStore] Unsubscribing from AEC');
      subscriptionRef();
      set({ subscriptionRef: null });
    }
  },

  // Start workflow execution
  startWorkflow: async (aecId: string, workspaceId: string) => {
    console.log('🚀 [WorkflowStore] Starting workflow for AEC:', aecId);

    set({ workflowState: 'generating', error: null });

    try {
      const token = (await (window as any).__getFirebaseToken?.()) || '';
      const response = await fetch(`/api/workflows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          aecId,
          workspaceId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start workflow');
      }

      // Subscribe to real-time updates
      get().subscribeToAEC(aecId, workspaceId);

      console.log('✅ [WorkflowStore] Workflow started');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to start workflow';
      console.error('❌ [WorkflowStore] Workflow start failed:', errorMsg);
      set({ error: errorMsg, workflowState: 'failed' });
      throw error;
    }
  },

  // Handle findings review suspension point
  resumeFromFindingsReview: async (action: 'proceed' | 'edit' | 'cancel') => {
    console.log('⏸️ [WorkflowStore] Resuming from findings review:', action);

    try {
      const token = (await (window as any).__getFirebaseToken?.()) || '';
      const response = await fetch(`/api/workflows/resume-findings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resume workflow');
      }

      set({ workflowState: 'generating' });
      console.log('✅ [WorkflowStore] Resumed from findings review');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to resume workflow';
      console.error('❌ [WorkflowStore] Resume failed:', errorMsg);
      set({ error: errorMsg });
      throw error;
    }
  },

  // Handle questions submission
  submitQuestionAnswers: async (answers: Record<string, string>) => {
    console.log('📝 [WorkflowStore] Submitting question answers');

    try {
      const token = (await (window as any).__getFirebaseToken?.()) || '';
      const response = await fetch(`/api/workflows/submit-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit answers');
      }

      set({ answers, workflowState: 'generating' });
      console.log('✅ [WorkflowStore] Answers submitted');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to submit answers';
      console.error('❌ [WorkflowStore] Submit answers failed:', errorMsg);
      set({ error: errorMsg });
      throw error;
    }
  },

  // Skip questions
  skipQuestions: async () => {
    console.log('⏭️ [WorkflowStore] Skipping questions');

    try {
      const token = (await (window as any).__getFirebaseToken?.()) || '';
      const response = await fetch(`/api/workflows/skip-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to skip questions');
      }

      set({ workflowState: 'generating', questions: [] });
      console.log('✅ [WorkflowStore] Skipped questions');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to skip questions';
      console.error('❌ [WorkflowStore] Skip questions failed:', errorMsg);
      set({ error: errorMsg });
      throw error;
    }
  },

  // Retry failed step
  retryStep: async (stepId: number) => {
    console.log('🔄 [WorkflowStore] Retrying step:', stepId);

    set({ isRetrying: true, error: null });

    try {
      const token = (await (window as any).__getFirebaseToken?.()) || '';
      const response = await fetch(`/api/workflows/retry-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stepId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to retry step');
      }

      set({ isRetrying: false, workflowState: 'generating' });
      console.log('✅ [WorkflowStore] Step retry initiated');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to retry step';
      console.error('❌ [WorkflowStore] Step retry failed:', errorMsg);
      set({ error: errorMsg, isRetrying: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Set answers (for local state before submission)
  setAnswers: (answers: Record<string, string>) => {
    set({ answers });
  },

  // Reset store to initial state
  reset: () => {
    const { subscriptionRef } = get();
    if (subscriptionRef) {
      subscriptionRef();
    }
    set(initialState);
  },
}));
