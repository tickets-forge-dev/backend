'use client';

import { useEffect, useState } from 'react';
import { useTicketsStore } from '@/stores/tickets.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/core/components/ui/button';
import { GitBranch, X, CheckCircle2, Loader2 } from 'lucide-react';
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
    isLoadingConnection,
    loadGitHubStatus,
  } = useSettingsStore();

  const [hasLoaded, setHasLoaded] = useState(false);

  // Load GitHub status on mount if not already loaded
  useEffect(() => {
    const loadData = async () => {
      await loadGitHubStatus(githubService);
      setHasLoaded(true);
    };
    loadData();
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

  // Show loading state while fetching data
  if (isLoadingConnection || !hasLoaded) {
    return (
      <div className="space-y-2">
        <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          Repository
        </label>
        <div className="h-10 px-3 border border-[var(--border)] rounded-md bg-[var(--bg)] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            Loading repositories...
          </span>
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
          <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-md bg-[var(--bg-subtle)] border-l-2 border-l-[var(--green)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--green)]" />
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

  // Show empty state if no repos available
  if (completedRepos.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          Repository
        </label>
        <div className="p-3 rounded-md bg-[var(--bg-subtle)]">
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            {!githubConnected
              ? 'Connect GitHub and index repositories in Settings to enable code-aware ticket generation'
              : 'No indexed repositories available. Index a repository in Settings first.'}
          </p>
        </div>
      </div>
    );
  }

  // Show repository selector with data
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
