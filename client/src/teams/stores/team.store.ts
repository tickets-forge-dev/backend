/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { useServices } from '@/services/index';
import type {
  Team,
  TeamSummary,
  CreateTeamRequest,
  UpdateTeamRequest,
  SwitchTeamRequest,
} from '../services/team.service';

const STORAGE_KEY = 'forge_currentTeamId';

/**
 * Team state interface
 */
interface TeamState {
  currentTeam: Team | null;
  teams: TeamSummary[];
  isLoading: boolean;
  error: string | null;
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
  createTeam: (name: string, allowMemberInvites?: boolean) => Promise<void>;
  updateTeam: (teamId: string, updates: UpdateTeamRequest) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  clearError: () => void;
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
  error: null,

  // Computed property for currentTeamId
  get currentTeamId() {
    return get().currentTeam?.id || null;
  },

  /**
   * Fetch user's teams list (lightweight)
   */
  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const { teamService } = useServices();
      const { teams, currentTeamId } = await teamService.getUserTeams();

      // Determine which team should be marked as current
      const storedTeamId = loadCurrentTeamIdFromStorage();
      const teamIdToUse = currentTeamId || storedTeamId;

      // Update isCurrent flag on all teams based on actual current team
      const teamsWithCurrentFlag = teams.map((team) => ({
        ...team,
        isCurrent: team.id === teamIdToUse,
      }));

      set({
        teams: teamsWithCurrentFlag,
        isLoading: false,
      });

      // Load full current team details if we have a currentTeamId
      if (teamIdToUse) {
        // Load full team details in background
        get().loadCurrentTeam();
      }

      // Sync localStorage with backend currentTeamId
      if (currentTeamId) {
        saveCurrentTeamIdToStorage(currentTeamId);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch teams',
        isLoading: false,
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

    set({ isLoading: true, error: null });
    try {
      const { teamService } = useServices();
      const team = await teamService.getTeam(storedTeamId);

      set({
        currentTeam: team,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load current team',
        isLoading: false,
      });
    }
  },

  /**
   * Switch to a different team
   */
  switchTeam: async (teamId: string) => {
    set({ isLoading: true, error: null });
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
      });

      // Persist to localStorage
      saveCurrentTeamIdToStorage(teamId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to switch team',
        isLoading: false,
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
}));
