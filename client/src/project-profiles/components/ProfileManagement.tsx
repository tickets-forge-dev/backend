'use client';

import { useEffect, useState } from 'react';
import { Loader2, FolderGit2 } from 'lucide-react';
import { useProjectProfileStore } from '../stores/project-profile.store';
import { ProfileStatusCard } from './ProfileStatusCard';
import { ProfileViewModal } from './ProfileViewModal';

export function ProfileManagement() {
  const { profiles, isLoading, loadProfiles, triggerScan, deleteProfile } =
    useProjectProfileStore();

  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleRescan = async (
    repoOwner: string,
    repoName: string,
    branch: string,
  ) => {
    await triggerScan(repoOwner, repoName, branch);
    await loadProfiles();
  };

  const handleDelete = async (profileId: string) => {
    await deleteProfile(profileId);
    await loadProfiles();
  };

  const handleView = (profileId: string) => {
    setViewProfileId(profileId);
    setViewModalOpen(true);
  };

  return (
    <>
      <section className="rounded-lg bg-[var(--bg-subtle)] p-6 space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Connected Repositories
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Project profiles speed up ticket creation by caching your repository
            structure.
          </p>
        </div>

        {isLoading && profiles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-6 py-10 text-center">
            <FolderGit2 className="mx-auto h-8 w-8 text-[var(--text-tertiary)]" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No repositories profiled yet. Profiles are created automatically
              when you connect a repository in the ticket wizard.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <ProfileStatusCard
                key={profile.id}
                profile={profile}
                onRescan={() =>
                  handleRescan(
                    profile.repoOwner,
                    profile.repoName,
                    profile.branch,
                  )
                }
                onDelete={() => handleDelete(profile.id)}
                onView={() => handleView(profile.id)}
              />
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
