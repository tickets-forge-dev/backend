'use client';

import React, { useEffect } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { RepositorySelector } from '../RepositorySelector';
import { BranchSelector } from '../BranchSelector';
import { GitBranch, Sparkles, Shield, Users } from 'lucide-react';

/**
 * CodebaseStep — Repository connection step.
 *
 * A friendly toggle card that explains the value of connecting a repo,
 * followed by repo/branch selectors when enabled.
 */
export function CodebaseStep() {
  const { gitHubService } = useServices();
  const { loadGitHubStatus } = useSettingsStore();
  const { selectedRepository } = useTicketsStore();
  const {
    input,
    includeRepository,
    setIncludeRepository,
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
        <h2 className="text-lg font-semibold text-[var(--text)]">Connect Your Codebase</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Link a repository to get smarter, more accurate tickets.
        </p>
      </div>

      {/* Toggle Card */}
      <button
        type="button"
        onClick={() => setIncludeRepository(!includeRepository)}
        className={`w-full text-left rounded-lg border-2 p-5 transition-all ${
          includeRepository
            ? 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/10 shadow-sm'
            : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border)]'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
            includeRepository ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}>
            <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              includeRepository ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <GitBranch className={`h-4 w-4 flex-shrink-0 ${includeRepository ? 'text-purple-500' : 'text-[var(--text-tertiary)]'}`} />
              <span className="text-sm font-semibold text-[var(--text)]">
                Analyze my repository
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              We&apos;ll read your code structure to generate tickets that reference the right files, APIs, and patterns.
              Your code stays on GitHub — nothing is downloaded or stored.
            </p>
          </div>
        </div>
      </button>

      {/* Benefits — shown when enabled */}
      {includeRepository && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 rounded-md bg-[var(--bg-subtle)] p-3">
            <Sparkles className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Tickets reference actual files and functions in your project</p>
          </div>
          <div className="flex items-start gap-2.5 rounded-md bg-[var(--bg-subtle)] p-3">
            <Shield className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Read-only access — your code is never cloned or stored</p>
          </div>
          <div className="flex items-start gap-2.5 rounded-md bg-[var(--bg-subtle)] p-3">
            <Users className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">No access? A team member can connect the repo for everyone</p>
          </div>
        </div>
      )}

      {/* Repository & Branch Selection — only when enabled */}
      {includeRepository && (
        <div className="border border-[var(--border-subtle)] rounded-lg p-5 space-y-4">
          <RepositorySelector />

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Branch
            </p>
            <BranchSelector hideLabel={true} />
          </div>
        </div>
      )}

      {/* Off state message */}
      {!includeRepository && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5 text-center space-y-1">
          <p className="text-sm text-[var(--text-secondary)]">
            No problem — you can still create great tickets without a repository.
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Tickets will be based on your description only. You can always connect a repo later.
          </p>
        </div>
      )}
    </div>
  );
}
