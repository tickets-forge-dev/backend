import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { AECResponse } from '@/services/ticket.service';
import type { BranchInfo } from '@/services/github.service';

interface TicketsState {
  tickets: AECResponse[];
  currentTicket: AECResponse | null;
  isCreating: boolean;
  createError: string | null;
  isLoading: boolean;
  loadError: string | null;
  fetchError: string | null;
  isUpdating: boolean;
  updateError: string | null;

  // Branch selection state (AC#5, Task 9)
  selectedRepository: string | null; // "owner/repo"
  selectedBranch: string | null;
  availableBranches: BranchInfo[];
  defaultBranch: string | null;
  isBranchesLoading: boolean;
  branchesError: string | null;

  // Actions
  createTicket: (title: string, description?: string) => Promise<AECResponse | null>;
  loadTickets: () => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  updateTicket: (
    id: string,
    data: { acceptanceCriteria?: string[]; assumptions?: string[] }
  ) => Promise<boolean>;
  clearCreateError: () => void;

  // Branch selection actions (AC#5, Task 9)
  setRepository: (repositoryFullName: string | null) => Promise<void>;
  setBranch: (branchName: string | null) => void;
  clearBranchSelection: () => void;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  currentTicket: null,
  isCreating: false,
  createError: null,
  isLoading: false,
  loadError: null,
  fetchError: null,
  isUpdating: false,
  updateError: null,

  // Branch selection state (AC#5, Task 9)
  selectedRepository: null,
  selectedBranch: null,
  availableBranches: [],
  defaultBranch: null,
  isBranchesLoading: false,
  branchesError: null,

  createTicket: async (title: string, description?: string) => {
    set({ isCreating: true, createError: null });

    try {
      const { ticketService } = useServices();
      const { selectedRepository, selectedBranch } = get();

      const aec = await ticketService.create({
        title,
        description,
        repositoryFullName: selectedRepository || undefined,
        branchName: selectedBranch || undefined,
      });

      // Add to local tickets list and clear branch selection
      set((state) => ({
        tickets: [aec, ...state.tickets],
        isCreating: false,
        selectedRepository: null,
        selectedBranch: null,
        availableBranches: [],
        defaultBranch: null,
      }));

      return aec;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create ticket';
      set({ isCreating: false, createError: errorMessage });
      return null;
    }
  },

  loadTickets: async () => {
    set({ isLoading: true, loadError: null });

    try {
      const { ticketService } = useServices();
      const tickets = await ticketService.list();

      set({ tickets, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load tickets';
      set({ isLoading: false, loadError: errorMessage });
    }
  },

  fetchTicket: async (id: string) => {
    set({ isLoading: true, fetchError: null, currentTicket: null });

    try {
      const { ticketService } = useServices();
      const ticket = await ticketService.getById(id);

      set({ currentTicket: ticket, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load ticket';
      set({ isLoading: false, fetchError: errorMessage });
    }
  },

  updateTicket: async (
    id: string,
    data: { acceptanceCriteria?: string[]; assumptions?: string[] }
  ) => {
    set({ isUpdating: true, updateError: null });

    try {
      const { ticketService } = useServices();
      const updatedTicket = await ticketService.update(id, data);

      // Update current ticket
      set({ currentTicket: updatedTicket, isUpdating: false });

      // Also update in tickets list if present
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? updatedTicket : t)),
      }));

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update ticket';
      set({ isUpdating: false, updateError: errorMessage });
      return false;
    }
  },

  clearCreateError: () => {
    set({ createError: null });
  },

  // Branch selection actions (AC#5, Task 9)
  setRepository: async (repositoryFullName: string | null) => {
    if (!repositoryFullName) {
      set({
        selectedRepository: null,
        selectedBranch: null,
        availableBranches: [],
        defaultBranch: null,
        branchesError: null,
      });
      return;
    }

    set({
      selectedRepository: repositoryFullName,
      selectedBranch: null,
      availableBranches: [],
      defaultBranch: null,
      isBranchesLoading: true,
      branchesError: null,
    });

    try {
      const { gitHubService } = useServices();
      const parts = repositoryFullName.split('/');
      if (parts.length !== 2) {
        throw new Error('Invalid repository format');
      }

      const [owner, repo] = parts;
      const branchesResponse = await gitHubService.getBranches(owner, repo);

      // Auto-select default branch (AC#1)
      set({
        availableBranches: branchesResponse.branches,
        defaultBranch: branchesResponse.defaultBranch,
        selectedBranch: branchesResponse.defaultBranch,
        isBranchesLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load branches';
      set({
        isBranchesLoading: false,
        branchesError: errorMessage,
        availableBranches: [],
        defaultBranch: null,
      });
    }
  },

  setBranch: (branchName: string | null) => {
    set({ selectedBranch: branchName });
  },

  clearBranchSelection: () => {
    set({
      selectedRepository: null,
      selectedBranch: null,
      availableBranches: [],
      defaultBranch: null,
      branchesError: null,
    });
  },
}));
