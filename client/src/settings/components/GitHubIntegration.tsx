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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { GitHubRepositoryItem } from '@/services/github.service';
import { Github, Check, AlertCircle, Loader2, Search } from 'lucide-react';

export function GitHubIntegration() {
  const { githubService } = useServices();
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

  // Load connection status on mount
  useEffect(() => {
    loadGitHubStatus(githubService);
  }, []);

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
      loadGitHubStatus(githubService);
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (error) {
      clearErrors();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [loadGitHubStatus, clearErrors]);

  const handleConnect = async () => {
    await initiateGitHubConnection(githubService);
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGitHub(githubService);
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
    try {
      const selected = githubRepositories.filter((repo) =>
        localSelectedRepos.has(repo.id)
      );
      await selectRepositories(githubService, selected);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <CardTitle>GitHub Integration</CardTitle>
          </div>
          {githubConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisconnectDialog(true)}
              disabled={isDisconnecting}
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
        <CardDescription>
          Connect your GitHub account to enable code-aware ticket generation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Error */}
        {connectionError && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{connectionError}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingConnection && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Not Connected State */}
        {!isLoadingConnection && !githubConnected && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Github className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">Connect GitHub</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Read-only access to your repositories. No code writes.
              </p>
              <Button onClick={handleConnect} disabled={isConnecting}>
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
          </div>
        )}

        {/* Connected State */}
        {!isLoadingConnection && githubConnected && githubConnectionStatus && (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>
                Connected as <strong>{githubConnectionStatus.accountLogin}</strong>
              </span>
              <span className="text-muted-foreground">
                ({githubConnectionStatus.accountType})
              </span>
            </div>

            {/* Repository Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Select Repositories</h4>
                {localSelectedRepos.size > 0 && (
                  <Button
                    size="sm"
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
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : repositoriesError ? (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{repositoriesError}</p>
                </div>
              ) : filteredRepositories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? 'No repositories match your search' : 'No repositories found'}
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-3">
                  {filteredRepositories.map((repo) => (
                    <label
                      key={repo.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localSelectedRepos.has(repo.id)}
                        onChange={() => handleToggleRepository(repo.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{repo.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {repo.private ? '🔒 Private' : '👁️ Public'} · {repo.defaultBranch}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
