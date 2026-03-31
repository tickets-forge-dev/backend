/**
 * GitHub Integration Settings Component
 * 
 * Displays GitHub connection status and manages OAuth flow.
 * - Shows "Connect GitHub" button when not connected
 * - Shows connection status and repository selection when connected
 * - Handles disconnect flow
 * 
 * Part of: Story 4.1 - Task 8
 * Layer: Presentation (UI Component)
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useProjectProfileStore } from '@/project-profiles/stores/project-profile.store';
import { GitHubRepositoryItem } from '@/services/github.service';
import { Github, Check, AlertCircle, Loader2, Search, Square, CheckSquare2 } from 'lucide-react';

interface GitHubIntegrationProps {
  onBeforeConnect?: () => void;
}

export function GitHubIntegration({ onBeforeConnect }: GitHubIntegrationProps = {}) {
  const { gitHubService } = useServices();
  const {
    githubConnected,
    githubConnectionStatus,
    githubRepositories,
    selectedRepositories,
    isLoadingConnection,
    isLoadingRepositories,
    isConnecting,
    isDisconnecting,
    connectionError,
    repositoriesError,
    githubTokenInvalid,
    loadGitHubStatus,
    loadRepositories,
    initiateGitHubConnection,
    selectRepositories,
    disconnectGitHub,
    clearErrors,
  } = useSettingsStore();

  const { triggerScan, startPolling, findByRepo } = useProjectProfileStore();

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [localSelectedRepos, setLocalSelectedRepos] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profilingStarted, setProfilingStarted] = useState<string[]>([]);

  // Load connection status on mount and fetch repos if connected
  useEffect(() => {
    console.log('[GitHubIntegration] Component mounted, loading GitHub status...');
    loadGitHubStatus(gitHubService);
  }, []);

  // Auto-load repositories when connected
  useEffect(() => {
    console.log('[GitHubIntegration] State changed:', {
      githubConnected,
      repositoriesCount: githubRepositories.length,
      isLoadingRepositories,
    });

    if (githubConnected && githubRepositories.length === 0 && !isLoadingRepositories) {
      console.log('[GitHubIntegration] Auto-loading repositories...');
      loadRepositories(gitHubService);
    }
  }, [githubConnected, isLoadingRepositories, gitHubService, loadRepositories, githubRepositories.length]);

  // Sync selected repos from store
  useEffect(() => {
    setLocalSelectedRepos(new Set(selectedRepositories.map((r) => r.id)));
  }, [selectedRepositories]);

  // Handle OAuth callback from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('[GitHubIntegration] Received message:', event.data, 'from origin:', event.origin);

      // Verify message origin for security
      const expectedOrigin = window.location.origin;
      if (event.origin !== expectedOrigin) {
        console.warn('[GitHubIntegration] Message origin mismatch. Expected:', expectedOrigin, 'Got:', event.origin);
        return;
      }

      // Check for GitHub OAuth callback message
      if (event.data?.type === 'github-oauth-callback') {
        console.log('[GitHubIntegration] OAuth callback received:', event.data.status);
        if (event.data.status === 'success') {
          console.log('[GitHubIntegration] Loading GitHub status (will auto-load repositories)...');
          // loadGitHubStatus already calls loadRepositories internally (settings.store.ts:105)
          // so we don't need to call it again here to avoid race conditions
          loadGitHubStatus(gitHubService);
        } else {
          console.error('[GitHubIntegration] OAuth failed:', event.data.message);
          clearErrors();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadGitHubStatus, loadRepositories, clearErrors, gitHubService]);

  const handleConnect = async () => {
    onBeforeConnect?.();
    await initiateGitHubConnection(gitHubService);
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGitHub(gitHubService);
      setShowDisconnectDialog(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleToggleRepository = (repoId: number) => {
    const newSet = new Set(localSelectedRepos);
    if (newSet.has(repoId)) {
      newSet.delete(repoId);
    } else {
      newSet.add(repoId);
    }
    setLocalSelectedRepos(newSet);
  };

  const handleSaveSelection = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setProfilingStarted([]);
    try {
      const selected = githubRepositories.filter((repo) =>
        localSelectedRepos.has(repo.id)
      );
      const previousIds = new Set(selectedRepositories.map(r => r.id));
      await selectRepositories(gitHubService, selected);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Auto-trigger profiling for newly added repos
      const newlyAdded = selected.filter(r => !previousIds.has(r.id));
      if (newlyAdded.length > 0) {
        const started: string[] = [];
        for (const repo of newlyAdded) {
          try {
            const existing = await findByRepo(repo.owner, repo.name);
            if (existing && (existing.status === 'ready' || existing.status === 'scanning' || existing.status === 'pending')) {
              continue;
            }
            await triggerScan(repo.owner, repo.name, repo.defaultBranch);
            startPolling(repo.owner, repo.name);
            started.push(repo.fullName);
          } catch {
            // Non-blocking — profile can be triggered manually later
            console.warn(`[GitHubIntegration] Failed to auto-profile ${repo.fullName}`);
          }
        }
        if (started.length > 0) {
          setProfilingStarted(started);
          setTimeout(() => setProfilingStarted([]), 8000);
        }
      }
    } catch (error) {
      // Error handled by store
    } finally {
      setIsSaving(false);
    }
  };


  const filteredRepositories = githubRepositories.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Github className="h-5 w-5 text-[var(--text-secondary)]" />
            <h3 className="text-[var(--text-base)] font-medium text-[var(--text)]">
              GitHub Integration
            </h3>
          </div>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            Connect your GitHub account to enable code-aware ticket generation
          </p>
        </div>
        {githubConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDisconnectDialog(true)}
            disabled={isDisconnecting}
            className="text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </Button>
        )}
      </div>

      {/* GitHub Token Invalid / Expired Error */}
      {githubTokenInvalid && (
        <div className="rounded-lg bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-[var(--red)] mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
              GitHub token expired or revoked
            </p>
            <p className="text-[var(--text-xs)] text-[var(--red)] opacity-90">
              Your GitHub connection is no longer valid. Please disconnect and reconnect to refresh your access token.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDisconnectDialog(true)}
                disabled={isDisconnecting}
                className="text-[var(--red)] hover:text-[var(--red)] hover:bg-red-500/20"
              >
                Disconnect
              </Button>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className=""
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-3 w-3" />
                    Reconnect GitHub
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error */}
      {connectionError && !githubTokenInvalid && (
        <div className="rounded-lg bg-red-500/10 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--red)] mt-0.5" />
          <p className="text-[var(--text-sm)] text-[var(--red)]">{connectionError}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingConnection && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </div>
      )}

      {/* Not Connected State */}
      {!isLoadingConnection && !githubConnected && (
        <div className="rounded-lg bg-[var(--bg-hover)] p-8 text-center">
          <Github className="mx-auto h-10 w-10 text-[var(--text-tertiary)] mb-3" />
          <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-1">Connect GitHub</h3>
          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-4">
            Read-only access to your repositories. No code writes.
          </p>
          <Button onClick={handleConnect} disabled={isConnecting} size="sm">
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Connect GitHub
              </>
            )}
          </Button>
        </div>
      )}

      {/* Connected State */}
      {!isLoadingConnection && githubConnected && githubConnectionStatus && (
        <div className="space-y-3">
          {/* Compact summary */}
          <div className="flex items-center gap-2 text-[var(--text-sm)]">
            <Check className="h-3 w-3 text-emerald-500" />
            <span className="text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text)]">{githubConnectionStatus.accountLogin}</span>
              {selectedRepositories.length > 0 && (
                <span className="text-[var(--text-tertiary)]"> · {selectedRepositories.length} repo{selectedRepositories.length !== 1 ? 's' : ''}</span>
              )}
            </span>
          </div>

          {/* Success / profiling toasts */}
          {saveSuccess && (
            <p className="text-[11px] text-emerald-500 pl-5">Saved</p>
          )}
          {profilingStarted.length > 0 && (
            <p className="text-[11px] text-blue-500 pl-5 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Profiling {profilingStarted.length} repo{profilingStarted.length !== 1 ? 's' : ''}...
            </p>
          )}

          {/* Expandable repo picker */}
          <details className="group">
            <summary className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors pl-5 list-none">
              Manage repositories
            </summary>

            <div className="mt-3 pl-5 space-y-3">
              {/* Search */}
              {githubRepositories.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] pl-8 pr-3 py-1.5 text-[12px] text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
                  />
                </div>
              )}

              {/* Repository List */}
              {isLoadingRepositories ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                </div>
              ) : repositoriesError && !githubTokenInvalid ? (
                <p className="text-[11px] text-red-400">{repositoriesError}</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-px scrollbar-thin">
                  {filteredRepositories.map((repo) => (
                    <label
                      key={repo.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={localSelectedRepos.has(repo.id)}
                        onChange={() => handleToggleRepository(repo.id)}
                        className="sr-only"
                      />
                      {localSelectedRepos.has(repo.id) ? (
                        <CheckSquare2 className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                      )}
                      <span className="text-[12px] text-[var(--text)] truncate flex-1">{repo.fullName}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{repo.private ? 'Private' : 'Public'}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Save */}
              <Button
                size="sm"
                onClick={handleSaveSelection}
                disabled={isSaving || isLoadingRepositories || localSelectedRepos.size === 0}
                className="h-7 text-[11px] disabled:opacity-40"
              >
                {isSaving ? (
                  <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Saving...</>
                ) : (
                  <>Save{localSelectedRepos.size > 0 ? ` (${localSelectedRepos.size})` : ''}</>
                )}
              </Button>
            </div>
          </details>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect GitHub?</DialogTitle>
            <DialogDescription>
              This will remove your GitHub connection and clear all repository selections.
              You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDisconnect}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
