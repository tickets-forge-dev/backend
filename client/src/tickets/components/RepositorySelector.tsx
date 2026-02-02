'use client';

import { useState } from 'react';
import { useTicketsStore } from '@/stores/tickets.store';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { GitBranch, X, Loader2 } from 'lucide-react';

/**
 * Repository Selector Component (AC#5, Task 7)
 *
 * Allows users to select or enter a GitHub repository.
 * In Story 4.1, this will be enhanced to show connected repositories.
 * For now, accepts manual input in "owner/repo" format.
 */
export function RepositorySelector() {
  const {
    selectedRepository,
    setRepository,
    isBranchesLoading,
    clearBranchSelection,
  } = useTicketsStore();

  const [inputValue, setInputValue] = useState(selectedRepository || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError('Please enter a repository');
      return;
    }

    // Validate format: owner/repo
    const parts = trimmed.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError('Format must be "owner/repo"');
      return;
    }

    setError(null);
    await setRepository(trimmed);
  };

  const handleClear = () => {
    setInputValue('');
    setError(null);
    clearBranchSelection();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // If repository is already selected, show it with clear option
  if (selectedRepository) {
    return (
      <div className="space-y-2">
        <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          Repository
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)]">
            <GitBranch className="h-4 w-4 text-[var(--text-tertiary)]" />
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
      <div className="flex items-center gap-2">
        <Input
          placeholder="owner/repo (e.g., facebook/react)"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className={error ? 'border-[var(--red)]' : ''}
        />
        <Button
          onClick={handleSubmit}
          disabled={isBranchesLoading}
          className="shrink-0"
        >
          {isBranchesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Load'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-[var(--text-xs)] text-[var(--red)]">{error}</p>
      )}
      <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
        Enter a public GitHub repository or one you have access to
      </p>
    </div>
  );
}
