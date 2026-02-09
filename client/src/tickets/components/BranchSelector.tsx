'use client';

import { useTicketsStore } from '@/stores/tickets.store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Loader2, Star, GitBranch, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  hideLabel?: boolean; // Hide internal label when parent is handling it
}

/**
 * Branch Selector Component (AC#2, Task 6)
 *
 * Displays a dropdown of available branches with metadata:
 * - Branch name
 * - Last commit info (author, date, message)
 * - Star icon for default branch
 * - Search/filter support
 * - Loading and error states
 */
export function BranchSelector({ hideLabel = false }: Props) {
  const {
    selectedRepository,
    selectedBranch,
    availableBranches,
    defaultBranch,
    isBranchesLoading,
    branchesError,
    setBranch,
    refreshBranches,
  } = useTicketsStore();

  // Don't render if no repository selected
  if (!selectedRepository) {
    return null;
  }

  // Loading state
  if (isBranchesLoading) {
    return (
      <div className="space-y-2">
        {!hideLabel && (
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
            Branch
          </label>
        )}
        <div className="flex items-center gap-2 h-10 px-3 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            Loading branches...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (branchesError) {
    return (
      <div className="space-y-2">
        {!hideLabel && (
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
            Branch
          </label>
        )}
        <div className="flex items-center gap-2 h-10 px-3 border border-[var(--red)]/50 rounded-md bg-[var(--red)]/5">
          <AlertCircle className="h-4 w-4 text-[var(--red)]" />
          <span className="text-[var(--text-sm)] text-[var(--red)]">
            {branchesError}
          </span>
        </div>
      </div>
    );
  }

  // Empty state
  if (availableBranches.length === 0) {
    return (
      <div className="space-y-2">
        {!hideLabel && (
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
            Branch
          </label>
        )}
        <div className="flex items-center gap-2 h-10 px-3 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)]">
          <GitBranch className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            No branches found
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {!hideLabel && (
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
            Branch
          </label>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshBranches}
          disabled={isBranchesLoading}
          className="h-6 px-2 text-[var(--text-tertiary)] hover:text-[var(--text)]"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isBranchesLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>
      <Select value={selectedBranch || ''} onValueChange={setBranch}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a branch">
            {selectedBranch && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span>{selectedBranch}</span>
                {selectedBranch === defaultBranch && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0 h-5 text-[var(--yellow)] border-[var(--yellow)]/30"
                  >
                    <Star className="h-3 w-3 mr-1 fill-[var(--yellow)]" />
                    default
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableBranches.map((branch) => (
            <SelectItem key={branch.name} value={branch.name}>
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span>{branch.name}</span>
                  {branch.isDefault && (
                    <Star className="h-3 w-3 text-[var(--yellow)] fill-[var(--yellow)]" />
                  )}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] truncate max-w-[200px]">
                  {branch.lastCommit.author && (
                    <span>{branch.lastCommit.author} · </span>
                  )}
                  {formatDate(branch.lastCommit.date)}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedBranch && (
        <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
          Ticket will be generated based on code in this branch
        </p>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
