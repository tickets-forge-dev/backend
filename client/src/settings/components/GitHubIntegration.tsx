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
import { Github, Check, AlertCircle, Loader2, Search, Database, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { IndexingSummaryCard } from './IndexingSummary';

export function GitHubIntegration() {
  const { githubService } = useServices();
  const {
    githubConnected,
    githubConnectionStatus,
    githubRepositories,
    selectedRepositories,
    indexingJobs,
    indexingQueue,
    isIndexing,
    indexingError,
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
    startIndexing,
    clearIndexingError,
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
  }, []);

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

  const [indexingRepoId, setIndexingRepoId] = useState<number | null>(null);

  // Clear indexing repo ID once the job appears in the store
  useEffect(() => {
    if (indexingRepoId !== null) {
      // Check if a job for this repo exists
      for (const [_, job] of indexingJobs.entries()) {
        if (job.repositoryId === indexingRepoId) {
          setIndexingRepoId(null);
          break;
        }
      }
    }
  }, [indexingJobs, indexingRepoId]);

  const handleStartIndexing = async (repo: GitHubRepositoryItem) => {
    // Immediately set loading state for this specific repo
    setIndexingRepoId(repo.id);
    
    try {
      // Get the latest commit SHA for the default branch
      const branches = await githubService.getBranches(repo.owner, repo.name);
      const defaultBranch = branches.branches.find(b => b.name === repo.defaultBranch);
      
      if (!defaultBranch) {
        console.error('Default branch not found');
        setIndexingRepoId(null);
        return;
      }

      await startIndexing(
        githubService,
        repo.id,
        repo.fullName,
        defaultBranch.commitSha
      );
      
      // Clear immediately after starting (store will handle the rest)
      setIndexingRepoId(null);
    } catch (error) {
      console.error('Failed to start indexing:', error);
      setIndexingRepoId(null);
    }
  };

  const getIndexingStatus = (repoId: number) => {
    for (const [indexId, job] of indexingJobs.entries()) {
      if (job.repositoryId === repoId) {
        return job.status;
      }
    }
    return null;
  };

  const [expandedRepos, setExpandedRepos] = useState<Set<number>>(new Set());

  const toggleRepoExpansion = (repoId: number) => {
    const newExpanded = new Set(expandedRepos);
    if (newExpanded.has(repoId)) {
      newExpanded.delete(repoId);
    } else {
      newExpanded.add(repoId);
    }
    setExpandedRepos(newExpanded);
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
          <div className="rounded p-3 border-l-[3px] border-l-[var(--red)] bg-[var(--bg-subtle)] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-[var(--red)] mt-0.5" />
            <p className="text-sm text-[var(--red)]">{connectionError}</p>
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
            <div className="rounded p-6 text-center bg-[var(--bg-subtle)]">
              <Github className="mx-auto h-12 w-12 text-[var(--text-tertiary)] mb-3" />
              <h3 className="font-medium mb-1 text-[var(--text)]">Connect GitHub</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Read-only access to your repositories. No code writes.
              </p>
              <Button onClick={handleConnect} disabled={isConnecting} className="bg-[var(--purple)] text-[var(--text-button)] hover:bg-[var(--purple)]/90">
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
                <div className="rounded-md bg-[var(--bg-subtle)] border-l-[3px] border-l-[var(--red)] p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[var(--red)] mt-0.5" />
                  <p className="text-sm text-[var(--red)]">{repositoriesError}</p>
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

            {/* Indexing Section (Story 4.2) */}
            {selectedRepositories.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <h4 className="text-sm font-medium">Code Indexing</h4>
                  </div>
                </div>

                {/* Queue Status */}
                {indexingQueue.length > 0 && (
                  <div className="rounded-md bg-[var(--bg-subtle)] border-l-[3px] border-l-[var(--blue)] p-3 flex items-start gap-2">
                    <Database className="h-4 w-4 text-[var(--blue)] mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-[var(--blue)]">
                        {indexingQueue.length} {indexingQueue.length === 1 ? 'repository' : 'repositories'} queued for indexing
                      </p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                        Processing up to 3 repositories at a time
                      </p>
                    </div>
                  </div>
                )}

                {/* Indexing Error */}
                {indexingError && (
                  <div className="rounded-md bg-[var(--bg-subtle)] border-l-[3px] border-l-[var(--red)] p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-[var(--red)] mt-0.5" />
                    <p className="text-sm text-[var(--red)]">{indexingError}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Selected repositories are automatically indexed. This process clones the repo, analyzes the code structure, and extracts key information for AI-powered ticket generation.
                </p>

                {/* Selected Repositories with Indexing Status */}
                <div className="space-y-2">
                  {selectedRepositories.map((repo) => {
                    const status = getIndexingStatus(repo.id);
                    const isRepoIndexing = status?.status === 'indexing' || status?.status === 'pending' || indexingRepoId === repo.id;
                    const queuePosition = indexingQueue.indexOf(repo.id);
                    const isQueued = queuePosition !== -1;

                    return (
                      <div
                        key={repo.id}
                        className="p-3 rounded-md border"
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                            onClick={() => status?.status === 'completed' && status.summary && toggleRepoExpansion(repo.id)}
                          >
                            <p className="text-sm font-medium truncate">{repo.fullName}</p>
                            
                            {/* Status Badge */}
                            <div className="flex items-center gap-1.5">
                              {status?.status === 'completed' && (
                                <>
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-muted-foreground">
                                    {status.filesIndexed} files
                                  </span>
                                </>
                              )}
                              {status?.status === 'failed' && (
                                <>
                                  <XCircle className="h-3 w-3 text-red-600" />
                                  <span className="text-xs text-red-600">Failed</span>
                                </>
                              )}
                              {isRepoIndexing && status && (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                  <span className="text-xs text-blue-600">
                                    {status.progress}%
                                  </span>
                                </>
                              )}
                              {status?.status === 'pending' && (
                                <>
                                  <Clock className="h-3 w-3 text-yellow-600 animate-pulse" />
                                  <span className="text-xs text-yellow-600">Cloning...</span>
                                </>
                              )}
                              {isQueued && !status && (
                                <>
                                  <Database className="h-3 w-3 text-gray-600" />
                                  <span className="text-xs text-gray-600">
                                    Queued ({queuePosition + 1})
                                  </span>
                                </>
                              )}
                              {!status && !isQueued && (
                                <>
                                  <Clock className="h-3 w-3 text-blue-500 animate-pulse" />
                                  <span className="text-xs text-blue-600">
                                    Initializing...
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Retry button for failed */}
                            {status?.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartIndexing(repo)}
                                disabled={isIndexing}
                              >
                                Retry
                              </Button>
                            )}
                            
                            {/* Expand/Collapse button for completed with summary */}
                            {status?.status === 'completed' && status.summary && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleRepoExpansion(repo.id)}
                                className="h-6 w-6 p-0"
                              >
                                {expandedRepos.has(repo.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expandable details */}
                        {expandedRepos.has(repo.id) && status?.status === 'completed' && status.summary && (
                          <div className="mt-3 pt-3 border-t">
                            <IndexingSummaryCard
                              summary={status.summary}
                              filesIndexed={status.filesIndexed}
                              repoSizeMB={status.repoSizeMB || 0}
                              durationMs={status.indexDurationMs}
                            />
                          </div>
                        )}

                        {/* Show error details if failed */}
                        {status?.status === 'failed' && status.errorDetails && (
                          <div className="mt-2 text-xs text-red-600">
                            {status.errorDetails.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
