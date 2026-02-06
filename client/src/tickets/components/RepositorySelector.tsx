'use client';

import { useEffect } from 'react';
import { useTicketsStore } from '@/stores/tickets.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/core/components/ui/button';
import { X, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';

/**
 * Repository Selector Component
 *
 * Allows user to select which GitHub repository to use for code-aware ticket generation.
 * With on-demand codebase scanning, repositories don't need to be pre-indexed.
 */
export function RepositorySelector() {
  const { gitHubService } = useServices();
  const {
    selectedRepository,
    setRepository,
    refreshBranches,
    clearBranchSelection,
  } = useTicketsStore();

  const {
    githubConnected,
    selectedRepositories,
    loadGitHubStatus,
  } = useSettingsStore();

  // Load GitHub status on mount if not already loaded
  useEffect(() => {
    if (!githubConnected) {
      loadGitHubStatus(gitHubService);
    }
  }, [githubConnected, loadGitHubStatus, gitHubService]);

  // Auto-select first repository if none selected, or refresh branches if already selected
  useEffect(() => {
    if (githubConnected && selectedRepositories.length > 0) {
      if (!selectedRepository) {
        handleSelect(selectedRepositories[0].fullName);
      } else {
        refreshBranches();
      }
    }
  }, [githubConnected, selectedRepositories]);

  const handleSelect = async (repoFullName: string) => {
    await setRepository(repoFullName);
  };

  const handleClear = () => {
    clearBranchSelection();
  };

  // If no GitHub connection
  if (!githubConnected) {
    return (
      <div className="space-y-2">
        <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          Repository
        </label>
        <div className="p-3 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)]">
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            Connect GitHub in{' '}
            <a href="/settings" className="text-[var(--blue)] hover:underline font-medium">
              Settings
            </a>{' '}
            to enable code-aware ticket generation.
          </p>
        </div>
      </div>
    );
  }

  // If no repositories selected in settings
  if (selectedRepositories.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          Repository
        </label>
        <div className="p-3 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)]">
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            Select repositories in{' '}
            <a href="/settings" className="text-[var(--blue)] hover:underline font-medium">
              Settings
            </a>{' '}
            to use them for ticket generation.
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
          <SelectValue placeholder="Select a repository..." />
        </SelectTrigger>
        <SelectContent>
          {selectedRepositories.map((repo) => (
            <SelectItem key={repo.id} value={repo.fullName}>
              {repo.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
        The code context helps generate accurate, implementation-ready tickets.
      </p>
    </div>
  );
}
