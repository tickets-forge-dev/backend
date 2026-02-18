'use client';

import { useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTeamStore } from '@/teams/stores/team.store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { OverviewTab } from '@/teams/components/OverviewTab';
import { MembersTab } from '@/teams/components/MembersTab';
import { SettingsTab } from '@/teams/components/SettingsTab';
import { Loader2 } from 'lucide-react';

/**
 * Team Management Page
 *
 * Professional team management interface with 3 tabs:
 * - Overview: Team info, member count, creation date
 * - Members: Active members table, pending invites, invite dialog
 * - Settings: Team name edit, invite settings, delete team
 */
function TeamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const teamId = params.teamId as string;
  const tab = (searchParams.get('tab') as 'overview' | 'members' | 'settings') || 'overview';

  const { currentTeam, isLoading, loadTeams, loadCurrentTeam, loadTeamMembers } = useTeamStore();

  useEffect(() => {
    // Load teams list and current team on mount
    loadTeams();
    if (teamId) {
      loadCurrentTeam();
      loadTeamMembers(teamId);
    }
  }, [teamId, loadTeams, loadCurrentTeam, loadTeamMembers]);

  if (isLoading || !currentTeam) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[var(--text)]">{currentTeam.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Manage your team members, settings, and permissions
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab team={currentTeam} />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab teamId={teamId} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab team={currentTeam} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function TeamPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <TeamPage />
    </Suspense>
  );
}
