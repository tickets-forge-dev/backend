'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeamStore } from '@/teams/stores/team.store';
import { Loader2 } from 'lucide-react';

/**
 * Teams Index Page
 *
 * Redirects to the current team's page.
 * If no current team, redirects to tickets.
 */
export default function TeamsIndexPage() {
  const router = useRouter();
  const { currentTeamId, teams, loadTeams } = useTeamStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      console.log('[TeamsIndexPage] Starting initialization...');

      try {
        // Always load fresh teams
        console.log('[TeamsIndexPage] Loading teams...');
        await loadTeams();

        // Small delay to ensure store has updated
        await new Promise(resolve => setTimeout(resolve, 100));

        const state = useTeamStore.getState();
        console.log('[TeamsIndexPage] Current state:', {
          currentTeamId: state.currentTeamId,
          teamsCount: state.teams.length,
          teams: state.teams,
        });

        const teamId = state.currentTeamId || (state.teams.length > 0 ? state.teams[0].id : null);
        console.log('[TeamsIndexPage] Team ID to redirect to:', teamId);

        setIsLoading(false);

        if (teamId) {
          console.log('[TeamsIndexPage] Redirecting to team:', teamId);
          router.replace(`/teams/${teamId}`);
        } else {
          console.log('[TeamsIndexPage] No teams found, redirecting to tickets');
          router.replace('/tickets');
        }
      } catch (error) {
        console.error('[TeamsIndexPage] Initialization error:', error);
        setIsLoading(false);
        // Fallback to tickets on error
        router.replace('/tickets');
      }
    };

    // Set timeout to prevent infinite loading - redirect to tickets after 3 seconds if still loading
    const timeoutId = setTimeout(() => {
      console.warn('[TeamsIndexPage] Initialization timeout, redirecting to tickets');
      setIsLoading(false);
      router.replace('/tickets');
    }, 3000);

    initialize().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // Only run once on mount - router and loadTeams are stable

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--primary)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          {isLoading ? 'Loading your team...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
