import { create } from 'zustand';

/**
 * Imported issue from Jira or Linear platform
 */
export interface ImportedIssue {
  id: string;
  key?: string; // Jira issue key (e.g., PROJ-123)
  identifier?: string; // Linear issue identifier (e.g., FOR-123)
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  url: string;
  mappedType: 'feature' | 'bug' | 'task';
  mappedPriority: 'low' | 'medium' | 'high' | 'urgent';
}

interface ImportWizardState {
  // Stage control (1, 2, 3)
  currentStage: number;

  // Platform selection
  platform: 'jira' | 'linear' | null;

  // Selected issue
  selectedIssue: ImportedIssue | null;

  // Actions
  setPlatform: (platform: 'jira' | 'linear') => void;
  setSelectedIssue: (issue: ImportedIssue) => void;
  goToStage: (stage: number) => void;
  reset: () => void;
}

export const useImportWizardStore = create<ImportWizardState>((set) => ({
  currentStage: 1,
  platform: null,
  selectedIssue: null,

  setPlatform: (platform) => set({ platform }),

  setSelectedIssue: (issue) => set({ selectedIssue: issue }),

  goToStage: (stage) => set({ currentStage: stage }),

  reset: () =>
    set({
      currentStage: 1,
      platform: null,
      selectedIssue: null,
    }),
}));
