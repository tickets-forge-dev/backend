/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { AECResponse } from '@/services/ticket.service';
import type { BranchInfo } from '@/services/github.service';

interface QuotaInfo {
  tokensUsed: number;
  tokenLimit: number;
  ticketsCreatedToday: number;
  dailyTicketLimit: number;
  canCreate: boolean;
  usagePercent: number;
}

interface TicketListPreferences {
  statusTab?: 'all' | 'needs-input' | 'complete' | 'draft' | 'needs-resume';
  sortBy?: 'updated' | 'created' | 'priority' | 'progress';
  collapsedGroups?: string[];
  priorityFilter?: string;
  typeFilter?: string;
  tagFilter?: string[];
}

interface TicketsState {
  tickets: AECResponse[];
  currentTicket: AECResponse | null;
  isCreating: boolean;
  createError: string | null;
  isLoading: boolean;
  isInitialLoad: boolean; // Track if first load hasn't completed yet
  loadError: string | null;
  fetchError: string | null;
  isUpdating: boolean;
  updateError: string | null;
  isDeleting: boolean;
  deleteError: string | null;
  isAssigning: boolean;
  assignError: string | null;

  // Archive
  archivedTickets: AECResponse[];
  isLoadingArchived: boolean;
  showArchived: boolean;

  // Quick draft
  isQuickCreating: boolean;
  quickCreateError: string | null;

  // Attachments
  isUploadingAttachment: boolean;
  uploadAttachmentError: string | null;

  // Quota
  quota: QuotaInfo | null;

  // Ticket list preferences
  listPreferences: TicketListPreferences;

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
  /** Re-fetches the current ticket without clearing it or showing a loader */
  refreshTicket: (id: string) => Promise<void>;
  fetchQuota: () => Promise<void>;
  updateTicket: (
    id: string,
    data: { title?: string; description?: string; acceptanceCriteria?: string[]; assumptions?: string[]; status?: string; techSpec?: Record<string, any> }
  ) => Promise<boolean>;
  deleteTicket: (id: string) => Promise<boolean>;
  archiveTicket: (id: string) => Promise<boolean>;
  unarchiveTicket: (id: string) => Promise<boolean>;
  loadArchivedTickets: () => Promise<void>;
  toggleShowArchived: () => void;
  assignTicket: (id: string, userId: string | null) => Promise<boolean>;
  clearCreateError: () => void;
  quickCreateDraft: (title: string, type?: string, priority?: string, folderId?: string) => Promise<AECResponse | null>;
  clearQuickCreateError: () => void;

  // List preferences
  setListPreferences: (preferences: TicketListPreferences) => void;

  // Export actions
  exportToLinear: (ticketId: string, teamId: string) => Promise<{ issueUrl: string; identifier: string } | null>;
  exportToJira: (ticketId: string, projectKey: string, sections?: string[]) => Promise<{ issueKey: string; issueUrl: string } | null>;

  // Attachment actions
  uploadAttachment: (ticketId: string, file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  deleteAttachment: (ticketId: string, attachmentId: string) => Promise<boolean>;

  // Branch selection actions (AC#5, Task 9)
  setRepository: (repositoryFullName: string | null) => Promise<void>;
  setBranch: (branchName: string | null) => void;
  refreshBranches: () => Promise<void>;
  clearBranchSelection: () => void;

  // Story 7-8: PM approves ticket
  approveTicket: (ticketId: string) => Promise<boolean>;

  // Story 7-10: PM triggers AI re-enrichment with developer Q&A answers
  reEnrichTicket: (ticketId: string) => Promise<boolean>;
}

/** Session-level branch cache — avoids re-fetching branches for repos already loaded */
const branchCache = new Map<string, { branches: BranchInfo[]; defaultBranch: string }>();

export const useTicketsStore = create<TicketsState>((set, get) => {
  // Load preferences from localStorage on init
  const loadPreferences = (): TicketListPreferences => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('tickets-list-preferences');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  return {
    tickets: [],
    currentTicket: null,
    isCreating: false,
    createError: null,
    isLoading: false,
    isInitialLoad: true, // Show skeletons only on first load
    loadError: null,
    fetchError: null,
    isUpdating: false,
    updateError: null,
    isDeleting: false,
    deleteError: null,
    isAssigning: false,
    assignError: null,

    // Archive
    archivedTickets: [],
    isLoadingArchived: false,
    showArchived: false,

    // Quick draft
    isQuickCreating: false,
    quickCreateError: null,

    // Attachments
    isUploadingAttachment: false,
    uploadAttachmentError: null,

    // Quota
    quota: null,

    // Ticket list preferences
    listPreferences: loadPreferences(),

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
    const { isInitialLoad, tickets: cachedTickets } = get();

    // First load: show skeleton loaders
    if (isInitialLoad) {
      set({ isLoading: true, loadError: null });
    }
    // Subsequent loads: show cached tickets, fetch silently in background
    else if (cachedTickets.length > 0) {
      set({ loadError: null });
    }

    try {
      const { ticketService } = useServices();
      const tickets = await ticketService.list();

      set({
        tickets,
        isLoading: false,
        isInitialLoad: false,
        loadError: null,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load tickets';
      set({
        isLoading: false,
        isInitialLoad: false,
        loadError: errorMessage
      });
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

  refreshTicket: async (id: string) => {
    try {
      const { ticketService } = useServices();
      const ticket = await ticketService.getById(id);
      set({ currentTicket: ticket });
    } catch {
      // Silent refresh — don't overwrite existing data on failure
    }
  },

  updateTicket: async (
    id: string,
    data: { title?: string; description?: string; acceptanceCriteria?: string[]; assumptions?: string[]; status?: string; techSpec?: Record<string, any> }
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

  // Story 3.5-5: Assign ticket to developer
  assignTicket: async (id: string, userId: string | null) => {
    set({ isAssigning: true, assignError: null });

    try {
      const { ticketService } = useServices();
      await ticketService.assign(id, userId);

      // Optimistic update: Update assignedTo in current ticket and tickets list
      set((state) => {
        const updatedTicket = state.currentTicket?.id === id
          ? { ...state.currentTicket, assignedTo: userId }
          : state.currentTicket;

        return {
          currentTicket: updatedTicket,
          tickets: state.tickets.map((t) =>
            t.id === id ? { ...t, assignedTo: userId } : t
          ),
          isAssigning: false,
        };
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign ticket';
      set({ isAssigning: false, assignError: errorMessage });
      return false;
    }
  },

  clearCreateError: () => {
    set({ createError: null });
  },

  quickCreateDraft: async (title: string, type?: string, priority?: string, folderId?: string) => {
    if (get().isQuickCreating) return null;
    set({ isQuickCreating: true, quickCreateError: null });

    try {
      const { ticketService } = useServices();
      const aec = await ticketService.create({ title, type: type || 'feature', priority: priority || 'low', folderId });

      set((state) => ({
        tickets: [aec, ...state.tickets],
        isQuickCreating: false,
      }));

      get().fetchQuota();
      return aec;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create draft';
      set({ isQuickCreating: false, quickCreateError: errorMessage });
      return null;
    }
  },

  clearQuickCreateError: () => {
    set({ quickCreateError: null });
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

  exportToJira: async (ticketId: string, projectKey: string, sections?: string[]) => {
    try {
      const { ticketService } = useServices();
      const result = await ticketService.exportToJira(ticketId, projectKey, sections);

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

  archiveTicket: async (id: string) => {
    try {
      const { ticketService } = useServices();
      await ticketService.archive(id);

      // Remove from active tickets list and archived cache
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
        currentTicket: state.currentTicket?.id === id ? null : state.currentTicket,
        archivedTickets: [], // invalidate cache so next toggle re-fetches
        showArchived: false,
      }));

      get().fetchQuota();
      return true;
    } catch (error: any) {
      return false;
    }
  },

  unarchiveTicket: async (id: string) => {
    try {
      const { ticketService } = useServices();
      await ticketService.unarchive(id);

      // Remove from archived list
      set((state) => ({
        archivedTickets: state.archivedTickets.filter((t) => t.id !== id),
      }));

      // Reload active tickets to pick up the restored one
      get().loadTickets();
      get().fetchQuota();
      return true;
    } catch (error: any) {
      return false;
    }
  },

  loadArchivedTickets: async () => {
    set({ isLoadingArchived: true });
    try {
      const { ticketService } = useServices();
      const archived = await ticketService.listArchived();
      set({ archivedTickets: archived, isLoadingArchived: false });
    } catch {
      set({ isLoadingArchived: false });
    }
  },

  toggleShowArchived: () => {
    const { showArchived } = get();
    if (!showArchived) {
      // Fetch archived tickets when expanding
      get().loadArchivedTickets();
    }
    set({ showArchived: !showArchived });
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

    // Check session cache first — instant if already loaded
    const cached = branchCache.get(repositoryFullName);
    if (cached) {
      set({
        selectedRepository: repositoryFullName,
        availableBranches: cached.branches,
        defaultBranch: cached.defaultBranch,
        selectedBranch: cached.defaultBranch,
        isBranchesLoading: false,
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

      // Cache for session
      branchCache.set(repositoryFullName, {
        branches: branchesResponse.branches,
        defaultBranch: branchesResponse.defaultBranch,
      });

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

    // Use cache if available (refreshBranches is called on re-mount)
    const cached = branchCache.get(selectedRepository);
    if (cached) {
      set({
        availableBranches: cached.branches,
        defaultBranch: cached.defaultBranch,
        selectedBranch: selectedBranch || cached.defaultBranch,
        isBranchesLoading: false,
      });
      return;
    }

    const parts = selectedRepository.split('/');
    if (parts.length !== 2) return;

    set({ isBranchesLoading: true, branchesError: null });

    try {
      const { gitHubService } = useServices();
      const [owner, repo] = parts;
      const branchesResponse = await gitHubService.getBranches(owner, repo);

      // Update cache
      branchCache.set(selectedRepository, {
        branches: branchesResponse.branches,
        defaultBranch: branchesResponse.defaultBranch,
      });

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

  setListPreferences: (preferences: TicketListPreferences) => {
    set({ listPreferences: preferences });
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tickets-list-preferences', JSON.stringify(preferences));
      } catch {
        // Silently fail if localStorage is unavailable
      }
    }
  },

  // Story 7-8: PM approves ticket — transitions REVIEW → FORGED
  approveTicket: async (ticketId: string) => {
    try {
      const { ticketService } = useServices();
      const updatedTicket = await ticketService.approveTicket(ticketId);

      // Update currentTicket and list optimistically with the returned data
      set((state) => ({
        currentTicket: state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
        tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
      }));

      return true;
    } catch (error: any) {
      console.error('[TicketsStore] approveTicket error:', error);
      return false;
    }
  },

  // Story 7-10: PM triggers AI re-enrichment with developer Q&A answers
  reEnrichTicket: async (ticketId: string) => {
    try {
      const { ticketService } = useServices();
      const updatedTicket = await ticketService.reEnrichTicket(ticketId);

      set((state) => ({
        currentTicket: state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
        tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
      }));

      return true;
    } catch (error: any) {
      console.error('[TicketsStore] reEnrichTicket error:', error);
      return false;
    }
  },
};
});
