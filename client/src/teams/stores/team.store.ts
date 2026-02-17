import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { teamService, type Team, type TeamSummary } from '../services/team.service';

interface TeamState {
  // State
  teams: TeamSummary[];
  currentTeamId: string | null;
  currentTeam: Team | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTeams: () => Promise<void>;
  loadCurrentTeam: () => Promise<void>;
  createTeam: (name: string, allowMemberInvites?: boolean) => Promise<Team>;
  switchTeam: (teamId: string) => Promise<void>;
  updateTeam: (teamId: string, updates: { name?: string; settings?: any }) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * useTeamStore - Zustand Store
 *
 * Global state management for teams.
 * Persists currentTeamId to localStorage.
 */
export const useTeamStore = create<TeamState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        teams: [],
        currentTeamId: null,
        currentTeam: null,
        isLoading: false,
        error: null,

        // Load all teams for user
        loadTeams: async () => {
          set({ isLoading: true, error: null });
          try {
            const result = await teamService.getUserTeams();
            set({
              teams: result.teams,
              currentTeamId: result.currentTeamId,
              isLoading: false,
            });

            // Load current team details if available
            if (result.currentTeamId) {
              await get().loadCurrentTeam();
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load teams';
            set({ error: message, isLoading: false });
          }
        },

        // Load current team details
        loadCurrentTeam: async () => {
          const { currentTeamId } = get();
          if (!currentTeamId) return;

          try {
            const team = await teamService.getTeam(currentTeamId);
            set({ currentTeam: team });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load current team';
            set({ error: message });
          }
        },

        // Create a new team
        createTeam: async (name: string, allowMemberInvites?: boolean) => {
          set({ isLoading: true, error: null });
          try {
            const team = await teamService.createTeam({ name, allowMemberInvites });

            // Reload teams to get updated list
            await get().loadTeams();

            set({ isLoading: false });
            return team;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create team';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        // Switch to a different team
        switchTeam: async (teamId: string) => {
          set({ isLoading: true, error: null });
          try {
            await teamService.switchTeam({ teamId });
            set({ currentTeamId: teamId, isLoading: false });

            // Reload teams and current team
            await get().loadTeams();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to switch team';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        // Update team
        updateTeam: async (teamId: string, updates: any) => {
          set({ isLoading: true, error: null });
          try {
            await teamService.updateTeam(teamId, updates);

            // Reload teams
            await get().loadTeams();

            set({ isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update team';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        // Delete team
        deleteTeam: async (teamId: string) => {
          set({ isLoading: true, error: null });
          try {
            await teamService.deleteTeam(teamId);

            // Reload teams
            await get().loadTeams();

            set({ isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete team';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        // Clear error
        clearError: () => set({ error: null }),
      }),
      {
        name: 'team-storage',
        partialize: (state) => ({ currentTeamId: state.currentTeamId }), // Only persist currentTeamId
      },
    ),
    { name: 'TeamStore' },
  ),
);
