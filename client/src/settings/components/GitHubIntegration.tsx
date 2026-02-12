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
    loadGitHubStatus,
    loadRepositories,
    initiateGitHubConnection,
    selectRepositories,
    disconnectGitHub,
    clearErrors,
  } = useSettingsStore();

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [localSelectedRepos, setLocalSelectedRepos] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load connection status on mount and fetch repos if connected
  useEffect(() => {
    loadGitHubStatus(gitHubService);
  }, []);

  // Auto-load repositories when connected
  useEffect(() => {
    if (githubConnected && githubRepositories.length === 0 && !isLoadingRepositories) {
      loadRepositories(gitHubService);
    }
  }, [githubConnected, isLoadingRepositories, gitHubService, loadRepositories, githubRepositories.length]);

  // Sync selected repos from store
  useEffect(() => {
    setLocalSelectedRepos(new Set(selectedRepositories.map((r) => r.id)));
  }, [selectedRepositories]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');

    if (connected === 'true') {
      loadGitHubStatus(gitHubService);
      loadRepositories(gitHubService);
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (error) {
      clearErrors();
      window.history.replaceState({}, '', window.location.pathname);
    }
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
    try {
      const selected = githubRepositories.filter((repo) =>
        localSelectedRepos.has(repo.id)
      );
      await selectRepositories(gitHubService, selected);
      setSaveSuccess(true);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
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

      {/* Connection Error */}
      {connectionError && (
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
        <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
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
        <div className="space-y-5">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-[var(--text-sm)]">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-[var(--text-secondary)]">
              Connected as <span className="font-medium text-[var(--text)]">{githubConnectionStatus.accountLogin}</span>
            </span>
            <span className="text-[var(--text-tertiary)]">
              ({githubConnectionStatus.accountType})
            </span>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="rounded-lg bg-green-500/10 p-3 flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-[var(--text-sm)] text-green-500">
                Saved {localSelectedRepos.size} repositor{localSelectedRepos.size === 1 ? 'y' : 'ies'} successfully
              </p>
            </div>
          )}

          {/* Currently Saved Repositories */}
          {selectedRepositories.length > 0 && (
            <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <p className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                  {selectedRepositories.length} repositor{selectedRepositories.length === 1 ? 'y' : 'ies'} enabled for ticket generation
                </p>
              </div>
              <div className="space-y-0.5 pl-6">
                {selectedRepositories.map((repo) => (
                  <p key={repo.id} className="text-[var(--text-xs)] text-[var(--text-secondary)]">
                    {repo.fullName}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Repository Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[var(--text-sm)] font-medium text-[var(--text)]">Select Repositories</h4>
              {localSelectedRepos.size > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveSelection}
                  disabled={isSaving || isLoadingRepositories}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Selection ({localSelectedRepos.size})</>
                  )}
                </Button>
              )}
            </div>

            {/* Search */}
            {githubRepositories.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* Repository List */}
            {isLoadingRepositories ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
              </div>
            ) : repositoriesError ? (
              <div className="rounded-lg bg-red-500/10 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--red)] mt-0.5" />
                <p className="text-[var(--text-sm)] text-[var(--red)]">{repositoriesError}</p>
              </div>
            ) : filteredRepositories.length === 0 ? (
              <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] text-center py-4">
                {searchQuery ? 'No repositories match your search' : 'No repositories found'}
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-0.5">
                {filteredRepositories.map((repo) => (
                  <label
                    key={repo.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={localSelectedRepos.has(repo.id)}
                      onChange={() => handleToggleRepository(repo.id)}
                      className="sr-only"
                    />
                    {localSelectedRepos.has(repo.id) ? (
                      <CheckSquare2 className="h-4 w-4 text-[var(--purple)] flex-shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-sm)] font-medium text-[var(--text)] truncate">{repo.fullName}</p>
                      <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                        {repo.private ? 'Private' : 'Public'} · {repo.defaultBranch}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
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
