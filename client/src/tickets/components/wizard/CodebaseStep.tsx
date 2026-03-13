'use client';

import React, { useEffect, useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { RepositorySelector } from '../RepositorySelector';
import { BranchSelector } from '../BranchSelector';
import { GitBranch, Sparkles, Shield, Users, HelpCircle, X, Terminal, CheckCircle2, MessageSquare, FileCode, Rocket } from 'lucide-react';

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
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5 text-center space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">
            No problem — you can still create great tickets without a repository.
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Tickets will be based on your description only. A developer can later refine the ticket with real code context using the CLI — adding file references, APIs, and patterns from your actual codebase.
          </p>
        </div>
      )}

      {/* Help — ticket lifecycle */}
      <TicketLifecycleHelp />
    </div>
  );
}

const lifecycleSteps = [
  {
    icon: FileCode,
    color: 'text-purple-500',
    title: 'PM creates the ticket',
    description: 'You describe the feature, bug, or task. Optionally connect a repo for smarter output.',
  },
  {
    icon: MessageSquare,
    color: 'text-violet-500',
    title: 'AI asks clarifying questions',
    description: 'Forge identifies gaps and ambiguities before any code is written.',
  },
  {
    icon: CheckCircle2,
    color: 'text-amber-500',
    title: 'Tech spec is generated',
    description: 'A structured AEC with acceptance criteria, scope, API changes, and wireframes.',
  },
  {
    icon: Terminal,
    color: 'text-blue-500',
    title: 'Developer refines with code context',
    description: 'Using the CLI, the developer reviews the spec and enriches it with real file paths, APIs, and patterns from the codebase.',
  },
  {
    icon: Rocket,
    color: 'text-green-500',
    title: 'Approved and executed',
    description: 'PM approves the final spec. The developer runs guided implementation — the AI builds exactly what was agreed.',
  },
];

function TicketLifecycleHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span>How does a ticket go from idea to code?</span>
      </button>

      {isOpen && (
        <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Ticket Lifecycle</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-0">
            {lifecycleSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex gap-3">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-[var(--bg)] border border-[var(--border-subtle)] flex items-center justify-center`}>
                      <Icon className={`h-3 w-3 ${step.color}`} />
                    </div>
                    {i < lifecycleSteps.length - 1 && (
                      <div className="w-px h-full min-h-[24px] bg-[var(--border-subtle)]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-4">
                    <p className="text-xs font-medium text-[var(--text)]">{step.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
