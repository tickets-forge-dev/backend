'use client';

import React, { useEffect } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { RepositorySelector } from '../RepositorySelector';
import { RepositoryToggle } from '../RepositoryToggle';
import { BranchSelector } from '../BranchSelector';

/**
 * CodebaseStep — Repository selection step.
 *
 * Shows the repository toggle, repo selector, and branch selector.
 * When the toggle is off, shows a message that code-aware suggestions are disabled.
 */
export function CodebaseStep() {
  const { gitHubService } = useServices();
  const { loadGitHubStatus } = useSettingsStore();
  const { selectedRepository } = useTicketsStore();
  const {
    input,
    includeRepository,
    setRepository,
  } = useWizardStore();

  // Load GitHub status on mount
  useEffect(() => {
    loadGitHubStatus(gitHubService);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync tickets store repository selection to wizard store
  useEffect(() => {
    if (selectedRepository) {
      const [owner, name] = selectedRepository.split('/');
      if (owner && name && (input.repoOwner !== owner || input.repoName !== name)) {
        setRepository(owner, name);
      }
    }
  }, [selectedRepository, input.repoOwner, input.repoName, setRepository]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Codebase</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Connect a repository for code-aware ticket generation.
        </p>
      </div>

      {/* Repository Toggle */}
      <RepositoryToggle />

      {/* Repository & Branch Selection — only when included */}
      {includeRepository && (
        <div className="border border-[var(--border-subtle)] rounded-lg bg-gray-50/50 dark:bg-gray-900/30 p-5 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Codebase to Scan
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Select the repository we&apos;ll analyze to understand your codebase structure, technology stack, and generate implementation-ready tickets based on the actual code.
            </p>
          </div>

          {/* Repository Selection */}
          <RepositorySelector />

          {/* Branch Selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
              Branch to Analyze
            </p>
            <BranchSelector hideLabel={true} />
          </div>

          {/* Future multi-repo placeholder */}
          <button
            type="button"
            disabled
            className="w-full text-center py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            + Add another repository (coming soon)
          </button>
        </div>
      )}

      {/* No repository message */}
      {!includeRepository && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            You can create tickets without a repository. Code-aware suggestions will be disabled.
          </p>
        </div>
      )}
    </div>
  );
}
