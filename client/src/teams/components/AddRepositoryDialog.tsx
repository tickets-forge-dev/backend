'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { useTeamStore } from '@/teams/stores/team.store';
import { useSettingsStore } from '@/stores/settings.store';
import { toast } from 'sonner';

interface AddRepositoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

type RepoRole = 'backend' | 'frontend' | 'shared';

const ROLES: { value: RepoRole; label: string }[] = [
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'shared', label: 'Shared' },
];

function getRolePillClass(role: RepoRole, selected: boolean): string {
  if (!selected) {
    return 'rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-[12px] font-medium text-[var(--text-tertiary)] transition-colors hover:border-zinc-600 hover:text-[var(--text-secondary)]';
  }
  switch (role) {
    case 'backend':
      return 'rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-[12px] font-medium text-violet-400 transition-colors';
    case 'frontend':
      return 'rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-[12px] font-medium text-blue-400 transition-colors';
    case 'shared':
      return 'rounded-full border border-teal-500/40 bg-teal-500/15 px-3 py-1 text-[12px] font-medium text-teal-400 transition-colors';
  }
}

/**
 * AddRepositoryDialog
 *
 * Lets a project owner select a GitHub repository, assign it a role
 * (backend / frontend / shared), and configure its default branch.
 */
export function AddRepositoryDialog({ open, onOpenChange, teamId }: AddRepositoryDialogProps) {
  const { selectedRepositories } = useSettingsStore();
  const { teamRepositories, addTeamRepository } = useTeamStore();

  // Filter out repos already added to the team
  const alreadyAdded = new Set(teamRepositories.map((r) => r.repositoryFullName));
  const availableRepos = selectedRepositories.filter((r) => !alreadyAdded.has(r.fullName));

  const [selectedRepo, setSelectedRepo] = useState('');
  const [role, setRole] = useState<RepoRole>('backend');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRepo) {
      toast.error('Please select a repository');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTeamRepository(teamId, {
        repositoryFullName: selectedRepo,
        role,
        defaultBranch: defaultBranch.trim() || 'main',
      });

      // Reset form and close
      setSelectedRepo('');
      setRole('backend');
      setDefaultBranch('main');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add repository';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!isSubmitting) {
      onOpenChange(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Repository</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Repository selector */}
          <div className="space-y-2">
            <label className="block text-[12px] font-medium text-[var(--text-secondary)]">
              Repository
            </label>
            {availableRepos.length === 0 ? (
              <p className="text-[12px] text-[var(--text-tertiary)]">
                No repositories available. Make sure you have GitHub connected and repositories
                selected in Settings.
              </p>
            ) : (
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-[13px] text-[var(--text-secondary)] outline-none focus:border-zinc-600 disabled:opacity-50 [&>option]:bg-zinc-800 [&>option]:text-[var(--text-secondary)]"
              >
                <option value="" disabled>
                  Select a repository...
                </option>
                {availableRepos.map((repo) => (
                  <option key={repo.fullName} value={repo.fullName}>
                    {repo.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Role picker */}
          <div className="space-y-2">
            <label className="block text-[12px] font-medium text-[var(--text-secondary)]">
              Role
            </label>
            <div className="flex items-center gap-2">
              {ROLES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  disabled={isSubmitting}
                  className={getRolePillClass(value, role === value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Default branch */}
          <div className="space-y-2">
            <label className="block text-[12px] font-medium text-[var(--text-secondary)]">
              Default branch
            </label>
            <input
              type="text"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder="main"
              disabled={isSubmitting}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 font-mono text-[13px] text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-zinc-600 disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedRepo || availableRepos.length === 0}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
