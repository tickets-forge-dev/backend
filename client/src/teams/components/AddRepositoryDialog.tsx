'use client';

import { useEffect, useState } from 'react';
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
import { useServices } from '@/hooks/useServices';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddRepositoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

/**
 * AddRepositoryDialog
 *
 * Lets a project owner select a GitHub repository and its default branch.
 * Role is auto-detected during project profiling — not user-selected.
 * Branches are fetched from GitHub when a repository is selected.
 */
export function AddRepositoryDialog({ open, onOpenChange, teamId }: AddRepositoryDialogProps) {
  const { selectedRepositories } = useSettingsStore();
  const { teamRepositories, addTeamRepository } = useTeamStore();
  const { gitHubService } = useServices();

  // Filter out repos already added to the team
  const alreadyAdded = new Set(teamRepositories.map((r) => r.repositoryFullName));
  const availableRepos = selectedRepositories.filter((r) => !alreadyAdded.has(r.fullName));

  const [selectedRepo, setSelectedRepo] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [branches, setBranches] = useState<Array<{ name: string; isDefault: boolean }>>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch branches when repo selection changes
  useEffect(() => {
    if (!selectedRepo) {
      setBranches([]);
      setDefaultBranch('main');
      return;
    }

    const [owner, name] = selectedRepo.split('/');
    if (!owner || !name) return;

    let cancelled = false;
    setIsLoadingBranches(true);

    gitHubService.getBranches(owner, name)
      .then((res) => {
        if (cancelled) return;
        const branchList = (res as any).branches || res;
        const list = Array.isArray(branchList) ? branchList : [];
        setBranches(list);
        // Auto-select the default branch
        const def = list.find((b: any) => b.isDefault);
        if (def) setDefaultBranch(def.name);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBranches(false);
      });

    return () => { cancelled = true; };
  }, [selectedRepo, gitHubService]);

  const handleSubmit = async () => {
    if (!selectedRepo) {
      toast.error('Please select a repository');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTeamRepository(teamId, {
        repositoryFullName: selectedRepo,
        role: 'shared', // Auto-detected during profiling; default to shared
        defaultBranch: defaultBranch.trim() || 'main',
      });

      // Reset form and close
      setSelectedRepo('');
      setDefaultBranch('main');
      setBranches([]);
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
                className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2 text-[13px] text-[var(--text-secondary)] outline-none focus:border-zinc-600 disabled:opacity-50 [&>option]:bg-[var(--bg-hover)] [&>option]:text-[var(--text-secondary)]"
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

          {/* Branch selector — fetched from GitHub */}
          <div className="space-y-2">
            <label className="block text-[12px] font-medium text-[var(--text-secondary)]">
              Default branch
            </label>
            {isLoadingBranches ? (
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text-tertiary)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading branches...
              </div>
            ) : (
              <select
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                disabled={isSubmitting || !selectedRepo || branches.length === 0}
                className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2 font-mono text-[13px] text-[var(--text-secondary)] outline-none focus:border-zinc-600 disabled:opacity-50 [&>option]:bg-[var(--bg-hover)] [&>option]:text-[var(--text-secondary)]"
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))
                ) : (
                  <option value="main">main</option>
                )}
              </select>
            )}
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
