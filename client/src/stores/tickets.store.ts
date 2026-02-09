/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { AECResponse } from '@/services/ticket.service';
import type { BranchInfo } from '@/services/github.service';

interface QuotaInfo {
  used: number;
  limit: number;
  canCreate: boolean;
}

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
  isDeleting: boolean;
  deleteError: string | null;

  // Attachments
  isUploadingAttachment: boolean;
  uploadAttachmentError: string | null;

  // Quota
  quota: QuotaInfo | null;

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
  fetchQuota: () => Promise<void>;
  updateTicket: (
    id: string,
    data: { description?: string; acceptanceCriteria?: string[]; assumptions?: string[]; status?: 'draft' | 'complete'; techSpec?: Record<string, any> }
  ) => Promise<boolean>;
  deleteTicket: (id: string) => Promise<boolean>;
  clearCreateError: () => void;

  // Export actions
  exportToLinear: (ticketId: string, teamId: string) => Promise<{ issueUrl: string; identifier: string } | null>;
  exportToJira: (ticketId: string, projectKey: string) => Promise<{ issueKey: string; issueUrl: string } | null>;

  // Attachment actions
  uploadAttachment: (ticketId: string, file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  deleteAttachment: (ticketId: string, attachmentId: string) => Promise<boolean>;

  // Branch selection actions (AC#5, Task 9)
  setRepository: (repositoryFullName: string | null) => Promise<void>;
  setBranch: (branchName: string | null) => void;
  refreshBranches: () => Promise<void>;
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
  isDeleting: false,
  deleteError: null,

  // Attachments
  isUploadingAttachment: false,
  uploadAttachmentError: null,

  // Quota
  quota: null,

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

      // Refresh quota after creation
      get().fetchQuota();

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

  fetchQuota: async () => {
    try {
      const { ticketService } = useServices();
      const quota = await ticketService.getQuota();
      set({ quota });
    } catch {
      // Silently fail — banner simply won't show
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
    data: { description?: string; acceptanceCriteria?: string[]; assumptions?: string[]; status?: 'draft' | 'complete'; techSpec?: Record<string, any> }
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

  exportToLinear: async (ticketId: string, teamId: string) => {
    try {
      const { ticketService } = useServices();
      const result = await ticketService.exportToLinear(ticketId, teamId);

      // Refresh the ticket to get the external issue link
      await get().fetchTicket(ticketId);

      return { issueUrl: result.issueUrl, identifier: result.identifier };
    } catch (error: any) {
      return null;
    }
  },

  exportToJira: async (ticketId: string, projectKey: string) => {
    try {
      const { ticketService } = useServices();
      const result = await ticketService.exportToJira(ticketId, projectKey);

      // Refresh the ticket to get the external issue link
      await get().fetchTicket(ticketId);

      return { issueKey: result.issueKey, issueUrl: result.issueUrl };
    } catch (error: any) {
      return null;
    }
  },

  uploadAttachment: async (ticketId: string, file: File, onProgress?: (percent: number) => void) => {
    set({ isUploadingAttachment: true, uploadAttachmentError: null });

    try {
      const { ticketService } = useServices();
      const attachment = await ticketService.uploadAttachment(ticketId, file, onProgress);

      // Update current ticket attachments
      set((state) => {
        const current = state.currentTicket;
        if (current && current.id === ticketId) {
          return {
            currentTicket: {
              ...current,
              attachments: [...(current.attachments || []), attachment],
            },
            isUploadingAttachment: false,
          };
        }
        return { isUploadingAttachment: false };
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload attachment';
      set({ isUploadingAttachment: false, uploadAttachmentError: errorMessage });
      return false;
    }
  },

  deleteAttachment: async (ticketId: string, attachmentId: string) => {
    try {
      const { ticketService } = useServices();
      await ticketService.deleteAttachment(ticketId, attachmentId);

      // Update current ticket attachments
      set((state) => {
        const current = state.currentTicket;
        if (current && current.id === ticketId) {
          return {
            currentTicket: {
              ...current,
              attachments: (current.attachments || []).filter((a) => a.id !== attachmentId),
            },
          };
        }
        return {};
      });

      return true;
    } catch (error: any) {
      return false;
    }
  },

  deleteTicket: async (id: string) => {
    set({ isDeleting: true, deleteError: null });

    try {
      const { ticketService } = useServices();
      await ticketService.delete(id);

      // Remove from tickets list
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
        currentTicket: state.currentTicket?.id === id ? null : state.currentTicket,
        isDeleting: false,
      }));

      // Refresh quota after deletion
      get().fetchQuota();

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete ticket';
      set({ isDeleting: false, deleteError: errorMessage });
      return false;
    }
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

  refreshBranches: async () => {
    const { selectedRepository, selectedBranch } = get();
    if (!selectedRepository) return;

    const parts = selectedRepository.split('/');
    if (parts.length !== 2) return;

    set({ isBranchesLoading: true, branchesError: null });

    try {
      const { gitHubService } = useServices();
      const [owner, repo] = parts;
      const branchesResponse = await gitHubService.getBranches(owner, repo);

      set({
        availableBranches: branchesResponse.branches,
        defaultBranch: branchesResponse.defaultBranch,
        selectedBranch: selectedBranch || branchesResponse.defaultBranch,
        isBranchesLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load branches';
      set({ isBranchesLoading: false, branchesError: errorMessage });
    }
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
