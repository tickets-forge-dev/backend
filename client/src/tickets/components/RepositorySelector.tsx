'use client';

import { useEffect } from 'react';
import { useTicketsStore } from '@/stores/tickets.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/core/components/ui/button';
import { GitBranch, X, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';

/**
 * Repository Selector Component (AC#5, Task 7)
 *
 * Shows dropdown of successfully indexed repositories only.
 * These repos provide code context for AI-powered ticket generation.
 */
export function RepositorySelector() {
  const { githubService } = useServices();
  const {
    selectedRepository,
    setRepository,
    clearBranchSelection,
  } = useTicketsStore();

  const {
    githubConnected,
    selectedRepositories,
    indexingJobs,
    loadGitHubStatus,
  } = useSettingsStore();

  // Load GitHub status on mount if not already loaded
  useEffect(() => {
    if (!githubConnected) {
      loadGitHubStatus(githubService);
    }
  }, []);

  // Get only completed indexed repositories
  const completedRepos = selectedRepositories.filter((repo) => {
    for (const [_, job] of indexingJobs.entries()) {
      if (job.repositoryId === repo.id && job.status?.status === 'completed') {
        return true;
      }
    }
    return false;
  });

  const handleSelect = async (repoFullName: string) => {
    await setRepository(repoFullName);
  };

  const handleClear = () => {
    clearBranchSelection();
  };

  // If no GitHub connection or no indexed repos
  if (!githubConnected || completedRepos.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          Repository
        </label>
        <div className="p-3 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)]">
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            {!githubConnected
              ? 'Connect GitHub and index repositories in Settings to enable code-aware ticket generation'
              : 'No indexed repositories available. Index a repository in Settings first.'}
          </p>
        </div>
      </div>
    );
  }

  // If repository is already selected, show it with clear option
  if (selectedRepository) {
    return (
      <div className="space-y-2">
        <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          Repository
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)]">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-[var(--text-sm)] text-[var(--text)]">
              {selectedRepository}
            </span>
            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] ml-auto">
              Indexed
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
        Repository
      </label>
      <Select onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select an indexed repository..." />
        </SelectTrigger>
        <SelectContent>
          {completedRepos.map((repo) => {
            // Get index stats for this repo
            let filesIndexed = 0;
            for (const [_, job] of indexingJobs.entries()) {
              if (job.repositoryId === repo.id && job.status?.status === 'completed') {
                filesIndexed = job.status.filesIndexed;
                break;
              }
            }

            return (
              <SelectItem key={repo.id} value={repo.fullName}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>{repo.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({filesIndexed} files)
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
        Only indexed repositories are shown. The code context helps generate accurate tickets.
      </p>
    </div>
  );
}
