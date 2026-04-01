'use client';

import React, { useEffect, useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { RepositorySelector } from '../RepositorySelector';
import { BranchSelector } from '../BranchSelector';
import { GitBranch, Sparkles, Shield, Users, HelpCircle, X, Terminal, CheckCircle2, MessageSquare, FileCode, Rocket, Plus } from 'lucide-react';
import { useProjectProfileStore, type ProjectProfileSummary } from '@/project-profiles/stores/project-profile.store';
import { ProfileStatusBadge } from '@/project-profiles/components/ProfileStatusBadge';

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
    setSecondaryRepository,
    removeSecondaryRepository,
    setSecondaryBranch,
    setSecondaryRole,
    setPrimaryRole,
  } = useWizardStore();
  const { selectedRepositories } = useSettingsStore();

  const { findByRepo, triggerScan, startPolling, stopPolling } = useProjectProfileStore();
  const [profileStatus, setProfileStatus] = useState<ProjectProfileSummary | null>(null);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);

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

  // Auto-check/trigger profile scan when repo is selected
  useEffect(() => {
    if (!input.repoOwner || !input.repoName) {
      setProfileStatus(null);
      return;
    }

    let cancelled = false;
    const owner = input.repoOwner;
    const name = input.repoName;

    async function checkProfile() {
      const existing = await findByRepo(owner, name);
      if (cancelled) return;

      if (existing) {
        setProfileStatus(existing);
        // If still in progress, poll until terminal
        if (existing.status === 'pending' || existing.status === 'scanning') {
          startPolling(owner, name, (updated) => {
            if (!cancelled) setProfileStatus(updated);
          });
        }
      } else {
        // No profile — auto-trigger scan
        try {
          await triggerScan(owner, name, input.branch);
          if (cancelled) return;
          const updated = await findByRepo(owner, name);
          if (cancelled) return;
          setProfileStatus(updated);
          // Start polling for the newly triggered scan
          startPolling(owner, name, (p) => {
            if (!cancelled) setProfileStatus(p);
          });
        } catch {
          // Scan trigger failed — non-blocking, user can continue
        }
      }
    }

    checkProfile();
    return () => {
      cancelled = true;
      stopPolling(owner, name);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.repoOwner, input.repoName]);

  const handleRescan = async () => {
    if (!input.repoOwner || !input.repoName) return;
    try {
      await triggerScan(input.repoOwner, input.repoName, input.branch);
      const updated = await findByRepo(input.repoOwner, input.repoName);
      setProfileStatus(updated);
      // Poll until complete
      startPolling(input.repoOwner, input.repoName, (p) => setProfileStatus(p));
    } catch {
      // Non-blocking
    }
  };

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
        <div className="space-y-3">
          <div className="border border-[var(--border-subtle)] rounded-lg p-5 space-y-4">
            <RepositorySelector />

            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Branch
              </p>
              <BranchSelector hideLabel={true} />
            </div>

            {/* Primary role — only shown when secondary repo is active */}
            {input.secondaryRepoOwner && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text-secondary)]">Role</p>
                <div className="flex gap-2">
                  {['backend', 'frontend', 'shared'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setPrimaryRole(input.primaryRole === role ? '' : role)}
                      className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                        input.primaryRole === role
                          ? 'border-purple-500/50 bg-purple-500/10 text-purple-500'
                          : 'border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border)]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile status badge — shows after repo selection */}
            {input.repoOwner && input.repoName && (
              <div className="pt-1">
                <ProfileStatusBadge
                  status={profileStatus?.status ?? null}
                  techStack={profileStatus?.techStack}
                  onRescan={handleRescan}
                />
              </div>
            )}
          </div>

          {/* Add second repository button */}
          {input.repoOwner && input.repoName && !input.secondaryRepoOwner && !showSecondaryPicker && (
            <button
              type="button"
              onClick={() => setShowSecondaryPicker(true)}
              className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add second repository
            </button>
          )}

          {/* Secondary repository picker */}
          {(showSecondaryPicker || input.secondaryRepoOwner) && (
            <div className="border border-[var(--border-subtle)] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Second Repository</span>
                <button
                  type="button"
                  onClick={() => {
                    removeSecondaryRepository();
                    setShowSecondaryPicker(false);
                  }}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <select
                value={input.secondaryRepoOwner && input.secondaryRepoName ? `${input.secondaryRepoOwner}/${input.secondaryRepoName}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    removeSecondaryRepository();
                    return;
                  }
                  const [owner, name] = val.split('/');
                  if (owner && name) {
                    setSecondaryRepository(owner, name);
                  }
                }}
                className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[13px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              >
                <option value="">Select a repository...</option>
                {selectedRepositories
                  .filter((r) => r.fullName !== `${input.repoOwner}/${input.repoName}`)
                  .map((r) => (
                    <option key={r.id} value={r.fullName}>
                      {r.fullName}
                    </option>
                  ))}
              </select>

              {/* Secondary branch */}
              {input.secondaryRepoOwner && input.secondaryRepoName && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Branch</p>
                  <input
                    type="text"
                    value={input.secondaryBranch || ''}
                    onChange={(e) => setSecondaryBranch(e.target.value)}
                    placeholder="main"
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[13px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                  />
                </div>
              )}

              {/* Secondary role */}
              {input.secondaryRepoOwner && input.secondaryRepoName && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Role</p>
                  <div className="flex gap-2">
                    {['backend', 'frontend', 'shared'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSecondaryRole(input.secondaryRole === role ? '' : role)}
                        className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                          input.secondaryRole === role
                            ? 'border-purple-500/50 bg-purple-500/10 text-purple-500'
                            : 'border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border)]'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
    description: 'forge identifies gaps and ambiguities before any code is written.',
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
    title: 'Ready and executed',
    description: 'PM marks the spec as Ready. The developer runs guided implementation — the AI builds exactly what was agreed.',
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
