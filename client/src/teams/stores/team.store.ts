/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { useServices } from '@/services/index';
import type {
  Team,
  TeamSummary,
  CreateTeamRequest,
  UpdateTeamRequest,
  SwitchTeamRequest,
  TeamMember,
  InviteMemberRequest,
  ChangeMemberRoleRequest,
} from '../services/team.service';

const STORAGE_KEY = 'forge_currentTeamId';

/**
 * Team state interface
 */
interface TeamState {
  currentTeam: Team | null;
  teams: TeamSummary[];
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  // Member management
  teamMembers: TeamMember[];
  isLoadingMembers: boolean;
  membersError: string | null;
  // Caching & deduplication
  lastTeamsFetch: number | null;
  lastCurrentTeamFetch: number | null;
  isTeamsLoading: boolean;
  isCurrentTeamLoading: boolean;
}

/**
 * Team actions interface
 */
interface TeamActions {
  currentTeamId: string | null;
  fetchTeams: () => Promise<void>;
  loadTeams: () => Promise<void>;
  loadCurrentTeam: () => Promise<void>;
  switchTeam: (teamId: string) => Promise<void>;
  switchToPersonal: () => Promise<void>;
  createTeam: (name: string, allowMemberInvites?: boolean) => Promise<void>;
  updateTeam: (teamId: string, updates: UpdateTeamRequest) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  clearError: () => void;
  // Member management actions
  loadTeamMembers: (teamId: string) => Promise<void>;
  inviteMember: (teamId: string, request: InviteMemberRequest) => Promise<void>;
  changeMemberRole: (teamId: string, userId: string, request: ChangeMemberRoleRequest) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  clearMembersError: () => void;
}

/**
 * Combined store type
 */
export type TeamStore = TeamState & TeamActions;

/**
 * Load currentTeamId from localStorage
 */
const loadCurrentTeamIdFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load currentTeamId from localStorage:', error);
    return null;
  }
};

/**
 * Save currentTeamId to localStorage
 */
const saveCurrentTeamIdToStorage = (teamId: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (teamId) {
      localStorage.setItem(STORAGE_KEY, teamId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save currentTeamId to localStorage:', error);
  }
};

/**
 * Team store for managing team state
 *
 * Handles:
 * - Current team selection
 * - Teams list
 * - CRUD operations (via TeamService)
 * - localStorage persistence
 */
export const useTeamStore = create<TeamStore>((set, get) => ({
  // Initial state
  currentTeam: null,
  teams: [],
  isLoading: false,
  isSwitching: false,
  error: null,
  // Member management state
  teamMembers: [],
  isLoadingMembers: false,
  membersError: null,
  // Caching & deduplication
  lastTeamsFetch: null,
  lastCurrentTeamFetch: null,
  isTeamsLoading: false,
  isCurrentTeamLoading: false,

  // Computed property for currentTeamId
  get currentTeamId() {
    return get().currentTeam?.id || null;
  },

  /**
   * Fetch user's teams list (lightweight)
   */
  fetchTeams: async () => {
    const state = get();

    // Deduplication: prevent multiple simultaneous calls
    if (state.isTeamsLoading) {
      return;
    }

    // Cache check: skip if fetched within last 30 seconds
    const CACHE_DURATION = 30000; // 30 seconds
    const now = Date.now();
    if (state.lastTeamsFetch && now - state.lastTeamsFetch < CACHE_DURATION) {
      return;
    }

    set({ isLoading: true, isTeamsLoading: true, error: null });
    try {
      const { teamService } = useServices();
      const { teams, currentTeamId } = await teamService.getUserTeams();

      // Determine which team should be marked as current
      const storedTeamId = loadCurrentTeamIdFromStorage();
      let teamIdToUse = currentTeamId || storedTeamId;

      // Validate that teamIdToUse is actually in the user's teams list
      const teamExists = teams.some((team) => team.id === teamIdToUse);
      if (teamIdToUse && !teamExists) {
        console.warn('[TeamStore] Stored team ID not in user teams, clearing:', teamIdToUse);
        saveCurrentTeamIdToStorage(null);
        teamIdToUse = null;
      }

      // Update isCurrent flag on all teams based on actual current team
      const teamsWithCurrentFlag = teams.map((team) => ({
        ...team,
        isCurrent: team.id === teamIdToUse,
      }));

      set({
        teams: teamsWithCurrentFlag,
        isLoading: false,
        isTeamsLoading: false,
        lastTeamsFetch: Date.now(),
      });

      // Load full current team details if we have a valid teamIdToUse
      if (teamIdToUse) {
        // Load full team details in background
        get().loadCurrentTeam();
      }

      // Sync localStorage with backend currentTeamId
      if (currentTeamId) {
        saveCurrentTeamIdToStorage(currentTeamId);
      }
    } catch (error) {
      // Log detailed error for debugging
      console.error('[TeamStore] Failed to fetch teams:', error);
      if (error instanceof Error) {
        console.error('[TeamStore] Error message:', error.message);
        console.error('[TeamStore] Error stack:', error.stack);
      }

      set({
        error: error instanceof Error ? error.message : 'Failed to fetch teams',
        isLoading: false,
        isTeamsLoading: false,
      });
    }
  },

  /**
   * Alias for fetchTeams (for compatibility with existing components)
   */
  loadTeams: async () => {
    return get().fetchTeams();
  },

  /**
   * Load full details for current team
   */
  loadCurrentTeam: async () => {
    const storedTeamId = loadCurrentTeamIdFromStorage();
    if (!storedTeamId) return;

    const state = get();

    // Deduplication: prevent multiple simultaneous calls
    if (state.isCurrentTeamLoading) {
      return;
    }

    // Cache check: skip if current team is already loaded and fetched recently (within 30 seconds)
    const CACHE_DURATION = 30000; // 30 seconds
    const now = Date.now();
    if (
      state.currentTeam?.id === storedTeamId &&
      state.lastCurrentTeamFetch &&
      now - state.lastCurrentTeamFetch < CACHE_DURATION
    ) {
      return;
    }

    set({ isLoading: true, isCurrentTeamLoading: true, error: null });
    try {
      const { teamService } = useServices();
      const team = await teamService.getTeam(storedTeamId);

      set({
        currentTeam: team,
        isLoading: false,
        isCurrentTeamLoading: false,
        lastCurrentTeamFetch: Date.now(),
      });
    } catch (error) {
      // Don't set global error for loadCurrentTeam failures - this is a secondary operation
      // Common case: stale team ID in localStorage (user left team or was removed)
      console.warn('[TeamStore] Failed to load current team from localStorage, clearing:', storedTeamId);
      console.warn('[TeamStore] Error:', error);

      // Clear stale team from localStorage
      saveCurrentTeamIdToStorage(null);

      set({
        currentTeam: null,
        isLoading: false,
        isCurrentTeamLoading: false,
        // Don't set global error - teams may have loaded successfully
      });
    }
  },

  /**
   * Switch to a different team
   */
  switchTeam: async (teamId: string) => {
    // Invalidate cache when switching teams to force fresh data
    set({
      isLoading: true,
      isSwitching: true,
      error: null,
      lastCurrentTeamFetch: null, // Invalidate cache
    });
    try {
      const { teamService } = useServices();
      await teamService.switchTeam({ teamId });

      // Load full team details
      const team = await teamService.getTeam(teamId);

      // Update isCurrent flag on all teams
      const { teams } = get();
      const updatedTeams = teams.map((t) => ({
        ...t,
        isCurrent: t.id === teamId,
      }));

      set({
        currentTeam: team,
        teams: updatedTeams,
        isLoading: false,
        isSwitching: false,
        lastCurrentTeamFetch: Date.now(), // Update cache timestamp
      });

      // Persist to localStorage
      saveCurrentTeamIdToStorage(teamId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to switch team',
        isLoading: false,
        isSwitching: false,
      });
    }
  },

  /**
   * Switch to personal workspace (no team)
   */
  switchToPersonal: async () => {
    set({
      isLoading: true,
      isSwitching: true,
      error: null,
      lastCurrentTeamFetch: null,
    });
    try {
      const { teamService } = useServices();
      await teamService.switchTeam({ teamId: null });

      // Update all teams to not current
      const { teams } = get();
      const updatedTeams = teams.map((t) => ({
        ...t,
        isCurrent: false,
      }));

      set({
        currentTeam: null,
        teams: updatedTeams,
        isLoading: false,
        isSwitching: false,
        lastCurrentTeamFetch: Date.now(),
      });

      // Clear from localStorage
      saveCurrentTeamIdToStorage(null);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to switch to personal workspace',
        isLoading: false,
        isSwitching: false,
      });
    }
  },

  /**
   * Create a new team and auto-switch to it
   */
  createTeam: async (name: string, allowMemberInvites = true) => {
    set({ isLoading: true, error: null });
    try {
      const { teamService } = useServices();
      const newTeam = await teamService.createTeam({ name, allowMemberInvites });

      // Convert Team to TeamSummary for list
      const teamSummary: TeamSummary = {
        id: newTeam.id,
        name: newTeam.name,
        slug: newTeam.slug,
        isOwner: newTeam.isOwner,
        isCurrent: true,
      };

      // Mark all existing teams as not current, add new team as current
      const { teams } = get();
      const updatedTeams = teams.map((t) => ({ ...t, isCurrent: false }));

      set({
        teams: [...updatedTeams, teamSummary],
        currentTeam: newTeam,
        isLoading: false,
        // Invalidate cache to force fresh fetch on next load
        lastTeamsFetch: null,
        lastCurrentTeamFetch: Date.now(), // Set current team cache since we just loaded it
      });

      // Persist to localStorage
      saveCurrentTeamIdToStorage(newTeam.id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create team',
        isLoading: false,
      });
    }
  },

  /**
   * Update team details
   */
  updateTeam: async (teamId: string, updates: UpdateTeamRequest) => {
    set({ isLoading: true, error: null });
    try {
      const { teamService } = useServices();
      const updatedTeam = await teamService.updateTeam(teamId, updates);

      // Update in teams list
      const { teams, currentTeam } = get();
      const updatedSummary: TeamSummary = {
        id: updatedTeam.id,
        name: updatedTeam.name,
        slug: updatedTeam.slug,
        isOwner: updatedTeam.isOwner,
        isCurrent: currentTeam?.id === updatedTeam.id,
      };

      set({
        teams: teams.map((t) => (t.id === teamId ? updatedSummary : t)),
        currentTeam: currentTeam?.id === teamId ? updatedTeam : currentTeam,
        isLoading: false,
        // Invalidate teams cache to force fresh fetch on next load
        lastTeamsFetch: null,
        // Update current team cache if this was the current team
        lastCurrentTeamFetch: currentTeam?.id === teamId ? Date.now() : get().lastCurrentTeamFetch,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update team',
        isLoading: false,
      });
    }
  },

  /**
   * Delete team (soft delete)
   */
  deleteTeam: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { teamService } = useServices();
      await teamService.deleteTeam(teamId);

      // Remove from teams list
      const { teams, currentTeam } = get();
      const updatedTeams = teams.filter((t) => t.id !== teamId);

      // Clear current team if it was deleted
      const newCurrentTeam = currentTeam?.id === teamId ? null : currentTeam;

      set({
        teams: updatedTeams,
        currentTeam: newCurrentTeam,
        isLoading: false,
        // Invalidate cache to force fresh fetch on next load
        lastTeamsFetch: null,
        lastCurrentTeamFetch: null,
      });

      // Clear localStorage if current team was deleted
      if (currentTeam?.id === teamId) {
        saveCurrentTeamIdToStorage(null);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete team',
        isLoading: false,
      });
    }
  },

  /**
   * Manually set current team (for UI updates without API call)
   */
  setCurrentTeam: (team: Team | null) => {
    set({ currentTeam: team });
    saveCurrentTeamIdToStorage(team?.id || null);
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Load team members
   */
  loadTeamMembers: async (teamId: string) => {
    set({ isLoadingMembers: true, membersError: null });
    try {
      const { teamService } = useServices();
      const members = await teamService.getTeamMembers(teamId);

      set({
        teamMembers: members,
        isLoadingMembers: false,
      });
    } catch (error) {
      set({
        membersError: error instanceof Error ? error.message : 'Failed to load team members',
        isLoadingMembers: false,
      });
    }
  },

  /**
   * Invite a new member
   */
  inviteMember: async (teamId: string, request: InviteMemberRequest) => {
    set({ isLoadingMembers: true, membersError: null });
    try {
      const { teamService } = useServices();
      await teamService.inviteMember(teamId, request);

      // Reload members list after successful invite
      await get().loadTeamMembers(teamId);
    } catch (error) {
      set({
        membersError: error instanceof Error ? error.message : 'Failed to invite member',
        isLoadingMembers: false,
      });
      throw error; // Re-throw so UI can show error
    }
  },

  /**
   * Change member role
   */
  changeMemberRole: async (
    teamId: string,
    userId: string,
    request: ChangeMemberRoleRequest,
  ) => {
    set({ isLoadingMembers: true, membersError: null });
    try {
      const { teamService } = useServices();
      await teamService.changeMemberRole(teamId, userId, request);

      // Update local state
      const { teamMembers } = get();
      const updatedMembers = teamMembers.map((m) =>
        m.userId === userId ? { ...m, role: request.role } : m,
      );

      set({
        teamMembers: updatedMembers,
        isLoadingMembers: false,
      });
    } catch (error) {
      set({
        membersError: error instanceof Error ? error.message : 'Failed to change member role',
        isLoadingMembers: false,
      });
      throw error; // Re-throw so UI can show error
    }
  },

  /**
   * Remove member from team
   */
  removeMember: async (teamId: string, userId: string) => {
    set({ isLoadingMembers: true, membersError: null });
    try {
      const { teamService } = useServices();
      await teamService.removeMember(teamId, userId);

      // Remove from local state
      const { teamMembers } = get();
      const updatedMembers = teamMembers.filter((m) => m.userId !== userId);

      set({
        teamMembers: updatedMembers,
        isLoadingMembers: false,
      });
    } catch (error) {
      set({
        membersError: error instanceof Error ? error.message : 'Failed to remove member',
        isLoadingMembers: false,
      });
      throw error; // Re-throw so UI can show error
    }
  },

  /**
   * Clear members error state
   */
  clearMembersError: () => {
    set({ membersError: null });
  },
}));
