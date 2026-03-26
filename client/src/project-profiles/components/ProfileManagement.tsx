'use client';

import { useEffect, useState } from 'react';
import { Loader2, FolderGit2, Zap } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { useProjectProfileStore, type ProjectProfileSummary } from '../stores/project-profile.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useServices } from '@/hooks/useServices';
import { ProfileStatusCard } from './ProfileStatusCard';
import { ProfileViewModal } from './ProfileViewModal';

/** Merged view: connected repo + its profile (if any) */
interface ConnectedRepoRow {
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  isPrivate: boolean;
  profile: ProjectProfileSummary | null;
}

export function ProfileManagement() {
  const { profiles, isLoading, loadProfiles, triggerScan, deleteProfile, startPolling, stopAllPolling } =
    useProjectProfileStore();
  const { selectedRepositories, githubConnected, loadGitHubStatus } =
    useSettingsStore();
  const { gitHubService } = useServices();

  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [scanningAll, setScanningAll] = useState(false);

  useEffect(() => {
    loadProfiles();
    if (!githubConnected) {
      loadGitHubStatus(gitHubService);
    }
    return () => stopAllPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge connected repos with profiles
  const rows: ConnectedRepoRow[] = selectedRepositories.map((repo) => {
    const profile = profiles.find(
      (p) => p.repoOwner === repo.owner && p.repoName === repo.name,
    );
    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      defaultBranch: repo.defaultBranch,
      isPrivate: repo.private,
      profile: profile ?? null,
    };
  });

  // Count repos needing attention
  const unprofiledCount = rows.filter(
    (r) => !r.profile || r.profile.status === 'failed',
  ).length;

  const handleScan = async (owner: string, name: string, branch: string) => {
    await triggerScan(owner, name, branch);
    await loadProfiles();
    startPolling(owner, name);
  };

  const handleDelete = async (profileId: string) => {
    await deleteProfile(profileId);
    await loadProfiles();
  };

  const handleView = (profileId: string) => {
    setViewProfileId(profileId);
    setViewModalOpen(true);
  };

  const handleScanAll = async () => {
    setScanningAll(true);
    const unprofiled = rows.filter(
      (r) => !r.profile || r.profile.status === 'failed',
    );
    for (const row of unprofiled) {
      try {
        await triggerScan(row.repoOwner, row.repoName, row.defaultBranch);
        startPolling(row.repoOwner, row.repoName);
      } catch {
        // Continue with next repo
      }
    }
    await loadProfiles();
    setScanningAll(false);
  };

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-medium text-[var(--text)]">Connected Repositories</h2>
          {unprofiledCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanAll}
              disabled={scanningAll}
            >
              {scanningAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {scanningAll ? 'Scanning...' : `Scan All (${unprofiledCount})`}
            </Button>
          )}
        </div>

        {isLoading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-subtle)] px-5 py-8 text-center">
            <FolderGit2 className="mx-auto h-6 w-6 text-[var(--text-tertiary)]" />
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              No repositories connected. Connect GitHub below.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {rows.map((row) => (
              <div key={`${row.repoOwner}/${row.repoName}`} className="px-5">
              <ProfileStatusCard
                profile={
                  row.profile ?? {
                    id: '',
                    repoOwner: row.repoOwner,
                    repoName: row.repoName,
                    branch: row.defaultBranch,
                    status: null,
                    scannedAt: null,
                    fileCount: 0,
                    techStack: [],
                    commitSha: null,
                    error: null,
                  }
                }
                onRescan={() =>
                  handleScan(
                    row.repoOwner,
                    row.repoName,
                    row.profile?.branch ?? row.defaultBranch,
                  )
                }
                onDelete={
                  row.profile ? () => handleDelete(row.profile!.id) : undefined
                }
                onView={
                  row.profile?.status === 'ready'
                    ? () => handleView(row.profile!.id)
                    : undefined
                }
              />
              </div>
            ))}
          </div>
        )}
      </section>

      <ProfileViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        profileId={viewProfileId}
      />
    </>
  );
}
