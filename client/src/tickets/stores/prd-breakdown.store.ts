/**
 * PRD Breakdown Store (Zustand)
 *
 * Manages state for the PRD breakdown workflow:
 * 1. Input: PRD text, repository selection
 * 2. Analysis: Breakdown result with epics and stories
 * 3. Review: User edits (title, priority, AC, etc.)
 * 4. Creation: Bulk creating tickets from breakdown
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type BreakdownStep = 'input' | 'review' | 'success';

export interface BDDCriterion {
  given: string;
  when: string;
  then: string;
}

export interface BreakdownTicket {
  id: number;
  epicName: string;
  epicIndex: number;
  storyIndex: number;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  acceptanceCriteria: BDDCriterion[];
  functionalRequirements: string[];
  blockedBy: number[];
  technicalNotes?: string;
}

export interface BreakdownEpic {
  index: number;
  name: string;
  goal: string;
  stories: BreakdownTicket[];
  functionalRequirements: string[];
}

export interface BreakdownSummary {
  totalTickets: number;
  epicCount: number;
  epics: BreakdownEpic[];
  frCoverage: Record<string, string[]>;
  frInventory: Array<{
    id: string;
    description: string;
  }>;
}

export interface BreakdownResult {
  tickets: BreakdownTicket[];
  summary: BreakdownSummary;
}

interface PRDBreakdownState {
  // Input step
  prdText: string;
  repositoryOwner: string;
  repositoryName: string;
  projectName: string;

  // Breakdown result
  breakdown: BreakdownResult | null;
  analysisTime: number | null;
  estimatedTicketsCount: number | null;

  // UI State
  currentStep: BreakdownStep;
  isAnalyzing: boolean;
  isCreating: boolean;
  error: string | null;
  createdTicketIds: string[];

  // Actions
  setPRDText: (text: string) => void;
  setRepository: (owner: string, name: string) => void;
  setProjectName: (name: string) => void;

  // Breakdown actions
  setBreakdown: (
    breakdown: BreakdownResult,
    analysisTime: number,
    estimatedTicketsCount: number,
  ) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;

  // Editing actions
  updateTicket: (ticketId: number, updates: Partial<BreakdownTicket>) => void;
  deleteTicket: (ticketId: number) => void;
  reorderTickets: (epicIndex: number, oldIndex: number, newIndex: number) => void;

  // Creation actions
  setCreating: (creating: boolean) => void;
  setCreatedTicketIds: (ids: string[]) => void;

  // Navigation
  moveToReview: () => void;
  moveToSuccess: () => void;
  reset: () => void;
}

const initialState = {
  prdText: '',
  repositoryOwner: '',
  repositoryName: '',
  projectName: '',
  breakdown: null,
  analysisTime: null,
  estimatedTicketsCount: null,
  currentStep: 'input' as const,
  isAnalyzing: false,
  isCreating: false,
  error: null,
  createdTicketIds: [],
};

export const usePRDBreakdownStore = create<PRDBreakdownState>()(
  devtools(
    (set) => ({
      ...initialState,

      setPRDText: (text) => set({ prdText: text }),

      setRepository: (owner, name) =>
        set({ repositoryOwner: owner, repositoryName: name }),

      setProjectName: (name) => set({ projectName: name }),

      setBreakdown: (breakdown, analysisTime, estimatedTicketsCount) =>
        set({ breakdown, analysisTime, estimatedTicketsCount }),

      setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

      setError: (error) => set({ error }),

      updateTicket: (ticketId, updates) =>
        set((state) => {
          if (!state.breakdown) return state;

          const updatedTickets = state.breakdown.tickets.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, ...updates } : ticket,
          );

          // Update epics with modified tickets
          const updatedEpics = state.breakdown.summary.epics.map((epic) => ({
            ...epic,
            stories: epic.stories.map(
              (story) =>
                updatedTickets.find((t) => t.id === story.id) || story,
            ),
          }));

          return {
            breakdown: {
              ...state.breakdown,
              tickets: updatedTickets,
              summary: {
                ...state.breakdown.summary,
                epics: updatedEpics,
              },
            },
          };
        }),

      deleteTicket: (ticketId) =>
        set((state) => {
          if (!state.breakdown) return state;

          const updatedTickets = state.breakdown.tickets.filter(
            (t) => t.id !== ticketId,
          );

          // Update epics
          const updatedEpics = state.breakdown.summary.epics
            .map((epic) => ({
              ...epic,
              stories: epic.stories.filter((s) => s.id !== ticketId),
            }))
            .filter((epic) => epic.stories.length > 0);

          return {
            breakdown: {
              ...state.breakdown,
              tickets: updatedTickets,
              summary: {
                ...state.breakdown.summary,
                epicCount: updatedEpics.length,
                epics: updatedEpics,
              },
            },
          };
        }),

      reorderTickets: (epicIndex, oldIndex, newIndex) =>
        set((state) => {
          if (!state.breakdown) return state;

          // Find the epic
          const epic = state.breakdown.summary.epics.find(
            (e) => e.index === epicIndex,
          );
          if (!epic) return state;

          // Reorder stories within the epic
          const reorderedStories = [...epic.stories];
          const [moved] = reorderedStories.splice(oldIndex, 1);
          reorderedStories.splice(newIndex, 0, moved);

          // Update epics
          const updatedEpics = state.breakdown.summary.epics.map((e) =>
            e.index === epicIndex ? { ...e, stories: reorderedStories } : e,
          );

          // Rebuild tickets list
          const updatedTickets = updatedEpics.flatMap((e) => e.stories);

          return {
            breakdown: {
              ...state.breakdown,
              tickets: updatedTickets,
              summary: {
                ...state.breakdown.summary,
                epics: updatedEpics,
              },
            },
          };
        }),

      setCreating: (creating) => set({ isCreating: creating }),

      setCreatedTicketIds: (ids) => set({ createdTicketIds: ids }),

      moveToReview: () => set({ currentStep: 'review' }),

      moveToSuccess: () => set({ currentStep: 'success' }),

      reset: () => set(initialState),
    }),
    { name: 'prd-breakdown-store' },
  ),
);
