'use client';

import React, { useEffect, useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { GitBranch, X, Plus } from 'lucide-react';
import { useProjectProfileStore, type ProjectProfileSummary } from '@/project-profiles/stores/project-profile.store';

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
  const [secondaryBranches, setSecondaryBranches] = useState<Array<{ name: string; isDefault: boolean }>>([]);

  // Fetch branches when secondary repo changes
  useEffect(() => {
    if (!input.secondaryRepoOwner || !input.secondaryRepoName) {
      setSecondaryBranches([]);
      return;
    }
    let cancelled = false;
    gitHubService.getBranches(input.secondaryRepoOwner, input.secondaryRepoName)
      .then((res) => {
        if (cancelled) return;
        const branches = (res as any).branches || res;
        setSecondaryBranches(Array.isArray(branches) ? branches : []);
        // Auto-select default branch
        const defaultBranch = Array.isArray(branches) ? branches.find((b: any) => b.isDefault) : null;
        if (defaultBranch && !input.secondaryBranch) {
          setSecondaryBranch(defaultBranch.name);
        }
      })
      .catch(() => setSecondaryBranches([]));
    return () => { cancelled = true; };
  }, [input.secondaryRepoOwner, input.secondaryRepoName]);

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
          <div className="rounded-lg border border-[var(--border-subtle)] p-3 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Repository</label>
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
                  className="w-full rounded-md bg-transparent text-[13px] text-[var(--text)] py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  {selectedRepositories.map((r) => (
                    <option key={r.id} value={r.fullName}>{r.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="w-40 shrink-0">
                <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Branch</label>
                <select
                  value={ticketsStore.selectedBranch || ticketsStore.defaultBranch || 'main'}
                  onChange={(e) => ticketsStore.setBranch(e.target.value)}
                  className="w-full rounded-md bg-transparent text-[13px] text-[var(--text)] py-0.5 focus:outline-none cursor-pointer"
                >
                  {ticketsStore.availableBranches.length > 0 ? (
                    ticketsStore.availableBranches.map((b) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))
                  ) : (
                    <option value="main">main</option>
                  )}
                </select>
              </div>
              {hasSecondary && (
                <div className="w-20 shrink-0">
                  <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Role</label>
                  <select
                    value={input.primaryRole || ''}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    className="w-full rounded-md bg-transparent text-[11px] text-[var(--text-tertiary)] py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="">—</option>
                    <option value="backend">backend</option>
                    <option value="frontend">frontend</option>
                    <option value="shared">shared</option>
                  </select>
                </div>
              )}
            </div>
            {/* Profile status inline */}
            {input.repoOwner && input.repoName && profileStatus?.status === 'ready' && (
              <span className="text-[10px] text-[var(--text-tertiary)]">✓ {profileStatus.techStack?.join(', ') || 'profiled'}</span>
            )}
            {input.repoOwner && input.repoName && profileStatus?.status === 'scanning' && (
              <span className="text-[10px] text-[var(--text-tertiary)]">Scanning...</span>
            )}
          </div>

          {/* Secondary repo row */}
          {(showSecondaryPicker || hasSecondary) && (
            <div className="rounded-lg border border-[var(--border-subtle)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Repository</label>
                  <select
                    value={hasSecondary ? `${input.secondaryRepoOwner}/${input.secondaryRepoName}` : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) { removeSecondaryRepository(); return; }
                      const [owner, name] = val.split('/');
                      if (owner && name) setSecondaryRepository(owner, name);
                    }}
                    className="w-full rounded-md bg-transparent text-[13px] text-[var(--text)] py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select...</option>
                    {availableSecondaryRepos.map((r) => (
                      <option key={r.id} value={r.fullName}>{r.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="w-28 shrink-0">
                  <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Branch</label>
                  <select
                    value={input.secondaryBranch || ''}
                    onChange={(e) => setSecondaryBranch(e.target.value)}
                    className="w-full rounded-md bg-transparent text-[13px] text-[var(--text)] py-0.5 focus:outline-none cursor-pointer"
                  >
                    {secondaryBranches.length > 0 ? (
                      secondaryBranches.map((b) => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))
                    ) : (
                      <option value="main">main</option>
                    )}
                  </select>
                </div>
                <div className="w-20 shrink-0">
                  <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Role</label>
                  <select
                    value={input.secondaryRole || ''}
                    onChange={(e) => setSecondaryRole(e.target.value)}
                    className="w-full rounded-md bg-transparent text-[11px] text-[var(--text-tertiary)] py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="">—</option>
                    <option value="backend">backend</option>
                    <option value="frontend">frontend</option>
                    <option value="shared">shared</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => { removeSecondaryRepository(); setShowSecondaryPicker(false); }}
                  className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors shrink-0 mt-3"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between pt-1">
            {/* Add repo — left side */}
            {input.repoOwner && input.repoName && !hasSecondary && !showSecondaryPicker && availableSecondaryRepos.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowSecondaryPicker(true)}
                className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add repository
              </button>
            ) : (
              <div />
            )}

            {/* Skip — right side */}
            <button
              type="button"
              onClick={() => setIncludeRepository(false)}
              className="text-[10px] text-[var(--text-tertiary)]/60 hover:text-[var(--text-tertiary)] transition-colors"
            >
              Skip
            </button>
          </div>
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

