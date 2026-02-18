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
      // Load teams if not already loaded
      if (teams.length === 0) {
        await loadTeams();
      }

      // Small delay to ensure store has updated
      await new Promise(resolve => setTimeout(resolve, 100));

      const state = useTeamStore.getState();
      const teamId = state.currentTeamId || (state.teams.length > 0 ? state.teams[0].id : null);

      setIsLoading(false);

      if (teamId) {
        router.replace(`/teams/${teamId}`);
      } else {
        // No teams found, redirect to tickets
        router.replace('/tickets');
      }
    };

    initialize();
  }, []); // Only run once on mount

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
