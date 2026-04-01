'use client';

import React, { useEffect, useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { GitBranch, X, Plus } from 'lucide-react';
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
  const ticketsStore = useTicketsStore();
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

  const hasSecondary = !!(input.secondaryRepoOwner && input.secondaryRepoName);
  const availableSecondaryRepos = selectedRepositories.filter(
    (r) => r.fullName !== `${input.repoOwner}/${input.repoName}`
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--text)]">Connect repositories</h2>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
          Link your codebase for smarter, code-aware tickets.
        </p>
      </div>

      {/* Repository rows */}
      {includeRepository ? (
        <div className="space-y-3">
          {/* Primary repo row */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <select
                value={selectedRepository || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    ticketsStore.setRepository(val);
                    const [o, n] = val.split('/');
                    if (o && n) setRepository(o, n);
                  }
                }}
                className="flex-1 min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] text-[13px] text-[var(--text)] px-3 py-2 focus:outline-none focus:border-[var(--border-hover)] appearance-none"
              >
                <option value="">Select repository...</option>
                {selectedRepositories.map((r) => (
                  <option key={r.id} value={r.fullName}>{r.fullName}</option>
                ))}
              </select>
              <select
                value={ticketsStore.selectedBranch || ticketsStore.defaultBranch || 'main'}
                onChange={(e) => ticketsStore.setBranch(e.target.value)}
                className="w-32 shrink-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] text-[13px] text-[var(--text)] px-3 py-2 focus:outline-none focus:border-[var(--border-hover)] appearance-none"
              >
                {ticketsStore.availableBranches.length > 0 ? (
                  ticketsStore.availableBranches.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))
                ) : (
                  <option value="main">main</option>
                )}
              </select>
              {hasSecondary && (
                <select
                  value={input.primaryRole || ''}
                  onChange={(e) => setPrimaryRole(e.target.value)}
                  className="w-24 shrink-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] text-[10px] text-[var(--text-tertiary)] px-2 py-2 focus:outline-none"
                >
                  <option value="">role</option>
                  <option value="backend">backend</option>
                  <option value="frontend">frontend</option>
                  <option value="shared">shared</option>
                </select>
              )}
            </div>
            {/* Profile badge inline */}
            {input.repoOwner && input.repoName && (
              <ProfileStatusBadge
                status={profileStatus?.status ?? null}
                techStack={profileStatus?.techStack}
                onRescan={handleRescan}
              />
            )}
          </div>

          {/* Secondary repo row */}
          {(showSecondaryPicker || hasSecondary) && (
            <div className="flex items-center gap-2">
              <select
                value={hasSecondary ? `${input.secondaryRepoOwner}/${input.secondaryRepoName}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) { removeSecondaryRepository(); return; }
                  const [owner, name] = val.split('/');
                  if (owner && name) setSecondaryRepository(owner, name);
                }}
                className="flex-1 min-w-0 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] text-[13px] text-[var(--text)] px-3 py-2 focus:outline-none focus:border-[var(--border-hover)]"
              >
                <option value="">Select repository...</option>
                {availableSecondaryRepos.map((r) => (
                  <option key={r.id} value={r.fullName}>{r.fullName}</option>
                ))}
              </select>
              <input
                type="text"
                value={input.secondaryBranch || ''}
                onChange={(e) => setSecondaryBranch(e.target.value)}
                placeholder="main"
                className="w-36 shrink-0 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] text-[13px] text-[var(--text)] px-3 py-2 focus:outline-none focus:border-[var(--border-hover)]"
              />
              <select
                value={input.secondaryRole || ''}
                onChange={(e) => setSecondaryRole(e.target.value)}
                className="w-24 shrink-0 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] text-[10px] text-[var(--text-tertiary)] px-2 py-2 focus:outline-none"
              >
                <option value="">role</option>
                <option value="backend">backend</option>
                <option value="frontend">frontend</option>
                <option value="shared">shared</option>
              </select>
              <button
                type="button"
                onClick={() => { removeSecondaryRepository(); setShowSecondaryPicker(false); }}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Add repo button */}
          {input.repoOwner && input.repoName && !hasSecondary && !showSecondaryPicker && availableSecondaryRepos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSecondaryPicker(true)}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors pl-1"
            >
              <Plus className="w-3 h-3" />
              Add repository
            </button>
          )}

          {/* Skip repo link */}
          <button
            type="button"
            onClick={() => setIncludeRepository(false)}
            className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors pl-1"
          >
            Skip — create without repository
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Tickets will be based on your description only.
          </p>
          <button
            type="button"
            onClick={() => setIncludeRepository(true)}
            className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <GitBranch className="w-3 h-3" />
            Connect a repository
          </button>
        </div>
      )}
    </div>
  );
}

