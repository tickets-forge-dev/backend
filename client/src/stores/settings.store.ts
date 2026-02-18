/**
 * Settings Store
 * 
 * Manages application settings including GitHub integration state.
 * 
 * Part of: Story 4.1 - Task 10
 * Layer: Client State Management (Zustand)
 */

import { create } from 'zustand';
import { GitHubService, ConnectionStatus, GitHubRepositoryItem, IndexJob, IndexStatus } from '@/services/github.service';

interface IndexingJobState {
  jobId: string;
  repositoryId: number;
  repositoryName: string;
  indexId?: string;
  status: IndexStatus | null;
  pollingInterval: NodeJS.Timeout | null;
}

interface SettingsState {
  // GitHub Integration State
  githubConnected: boolean;
  githubConnectionStatus: ConnectionStatus | null;
  githubRepositories: GitHubRepositoryItem[];
  selectedRepositories: GitHubRepositoryItem[];
  repositoriesFetchedAt: number | null; // Timestamp for cache validation
  githubTokenInvalid: boolean; // True if token is expired/invalid (401 error)

  // Indexing State (Story 4.2)
  indexingJobs: Map<string, IndexingJobState>;
  indexingQueue: number[]; // Repository IDs waiting to be indexed
  maxConcurrentIndexing: number; // Limit concurrent indexing
  isIndexing: boolean;
  indexingError: string | null;

  // Loading States
  isLoadingConnection: boolean;
  isLoadingRepositories: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Error States
  connectionError: string | null;
  repositoriesError: string | null;

  // Actions
  loadGitHubStatus: (githubService: GitHubService) => Promise<void>;
  loadRepositories: (githubService: GitHubService) => Promise<void>;
  initiateGitHubConnection: (githubService: GitHubService) => Promise<void>;
  selectRepositories: (githubService: GitHubService, repositories: GitHubRepositoryItem[]) => Promise<void>;
  disconnectGitHub: (githubService: GitHubService) => Promise<void>;
  clearErrors: () => void;
  
  // Indexing Actions (Story 4.2)
  startIndexing: (githubService: GitHubService, repositoryId: number, repositoryName: string, commitSha: string) => Promise<void>;
  pollIndexingStatus: (githubService: GitHubService, indexId: string) => void;
  stopPolling: (indexId: string) => void;
  clearIndexingError: () => void;
  loadExistingIndexes: (githubService: GitHubService) => Promise<void>;
  queueRepositoriesForIndexing: (githubService: GitHubService, repositories: GitHubRepositoryItem[]) => Promise<void>;
  processIndexingQueue: (githubService: GitHubService) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial State
  githubConnected: false,
  githubConnectionStatus: null,
  githubRepositories: [],
  selectedRepositories: [],
  repositoriesFetchedAt: null,
  githubTokenInvalid: false,
  indexingJobs: new Map(),
  indexingQueue: [],
  maxConcurrentIndexing: 3, // Max 3 concurrent indexing jobs
  isIndexing: false,
  indexingError: null,
  isLoadingConnection: false,
  isLoadingRepositories: false,
  isConnecting: false,
  isDisconnecting: false,
  connectionError: null,
  repositoriesError: null,

  /**
   * Load GitHub connection status
   * AC#1: Check and display connection status
   */
  loadGitHubStatus: async (githubService: GitHubService) => {
    set({ isLoadingConnection: true, connectionError: null, githubTokenInvalid: false });

    try {
      const status = await githubService.getConnectionStatus();
      set({
        githubConnected: status.connected,
        githubConnectionStatus: status,
        selectedRepositories: status.selectedRepositories || [],
        isLoadingConnection: false,
        githubTokenInvalid: false, // Clear on status check
      });

      // If connected, auto-load repositories (no indexing - we use on-demand scanning)
      if (status.connected) {
        get().loadRepositories(githubService);
      }
    } catch (error: any) {
      console.error('Failed to load GitHub status:', error);
      set({
        connectionError: error.response?.data?.message || 'Failed to load GitHub connection status',
        isLoadingConnection: false,
        githubConnected: false,
        githubConnectionStatus: null,
        githubTokenInvalid: false,
      });
    }
  },

  /**
   * Load existing indexes for selected repositories
   * Shows summaries for completed indexes
   * Note: Gracefully skips if indexing endpoint not available
   */
  loadExistingIndexes: async (githubService: GitHubService) => {
    try {
      const indexes = await githubService.listIndexes();
      const jobs = new Map(get().indexingJobs);

      // Update or create jobs with existing indexes
      for (const index of indexes) {
        jobs.set(index.repositoryName, {
          jobId: index.indexId,
          repositoryId: index.repositoryId,
          repositoryName: index.repositoryName,
          indexId: index.indexId,
          status: index,
          pollingInterval: null,
        });
      }
      
      set({ indexingJobs: jobs });
      console.log(`✅ Loaded ${indexes.length} existing indexes with summaries`);
    } catch (error: any) {
      // Graceful degradation: 404 means indexing endpoint not available (use on-demand scanning instead)
      if (error?.response?.status === 404) {
        console.log('ℹ️ Indexing endpoint not available - using on-demand code scanning');
      } else {
        console.error('Failed to load existing indexes:', error?.message);
      }
      // Don't throw - this is graceful degradation
    }
  },

  /**
   * Load user's accessible repositories
   * AC#4: Display repository list
   *
   * Uses cache to avoid excessive API calls.
   * Refreshes if data is older than 5 minutes.
   *
   * Handles 401 "Bad credentials" specially - sets githubTokenInvalid flag
   * to prevent endless retry loops.
   */
  loadRepositories: async (githubService: GitHubService) => {
    const now = Date.now();
    const { repositoriesFetchedAt, githubRepositories, githubTokenInvalid } = get();

    // Don't retry if we already know the token is invalid
    if (githubTokenInvalid) {
      console.log('⚠️ GitHub token is invalid - skipping retry (user must reconnect)');
      return;
    }

    // Cache is valid if fetched within 5 minutes
    const CACHE_DURATION = 5 * 60 * 1000;
    if (repositoriesFetchedAt && now - repositoriesFetchedAt < CACHE_DURATION && githubRepositories.length > 0) {
      console.log('📦 Using cached repositories (age:', Math.round((now - repositoriesFetchedAt) / 1000), 's)');
      return;
    }

    set({ isLoadingRepositories: true, repositoriesError: null });

    try {
      const repositories = await githubService.listRepositories();
      console.log('📥 Fetched', repositories.length, 'repositories from GitHub');
      set({
        githubRepositories: repositories,
        repositoriesFetchedAt: now,
        isLoadingRepositories: false,
        githubTokenInvalid: false, // Clear token invalid flag on success
      });
    } catch (error: any) {
      console.error('Failed to load repositories:', error);

      // Detect 401 "Bad credentials" errors (token invalid/expired)
      const isAuthError = (error as any).isAuthError || error.response?.status === 401;

      set({
        repositoriesError: error.message || error.response?.data?.message || 'Failed to load repositories',
        isLoadingRepositories: false,
        githubTokenInvalid: isAuthError, // Set flag to prevent retries
      });
    }
  },

  /**
   * Initiate GitHub OAuth connection
   * AC#2: Launch OAuth flow
   */
  initiateGitHubConnection: async (githubService: GitHubService) => {
    set({ isConnecting: true, connectionError: null });

    try {
      const oauthUrl = await githubService.getOAuthUrl();

      // Open OAuth in popup window (prevents session loss)
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        oauthUrl,
        'GitHub OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Poll for popup close (OAuth callback will trigger loadGitHubStatus via useEffect)
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          set({ isConnecting: false });
        }
      }, 500);
    } catch (error: any) {
      console.error('Failed to initiate GitHub connection:', error);
      set({
        connectionError: error.response?.data?.message || 'Failed to connect to GitHub',
        isConnecting: false,
      });
    }
  },

  /**
   * Select repositories for indexing
   * AC#5: Save repository selection + Auto-start indexing (only for newly selected repos)
   */
  selectRepositories: async (
    githubService: GitHubService,
    repositories: GitHubRepositoryItem[]
  ) => {
    try {
      // Get previously selected repos BEFORE updating
      const previouslySelected = get().selectedRepositories;
      const previousIds = new Set(previouslySelected.map(r => r.id));
      
      await githubService.selectRepositories(repositories);
      set({
        selectedRepositories: repositories,
      });

      // NOTE: Auto-indexing disabled - using on-demand code scanning instead
      // When user creates a ticket with a repo, code is scanned on-demand via GitHubFileService
      // No need for pre-computed indexes
      console.log(`✅ Selected ${repositories.length} repositories for code-aware ticket generation`);
    } catch (error: any) {
      console.error('Failed to select repositories:', error);
      set({
        repositoriesError: error.response?.data?.message || 'Failed to save repository selection',
      });
      throw error;
    }
  },

  /**
   * Queue repositories for indexing with concurrency control
   */
  queueRepositoriesForIndexing: async (
    githubService: GitHubService,
    repositories: GitHubRepositoryItem[]
  ) => {
    // Add to queue
    const queue = [...get().indexingQueue, ...repositories.map(r => r.id)];
    set({ indexingQueue: queue });
    
    // Start processing queue
    get().processIndexingQueue(githubService);
  },

  /**
   * Process indexing queue with concurrency limits
   */
  processIndexingQueue: async (githubService: GitHubService) => {
    const { indexingQueue, indexingJobs, maxConcurrentIndexing, selectedRepositories } = get();
    
    // Count currently indexing jobs
    let activeCount = 0;
    for (const [_, job] of indexingJobs.entries()) {
      if (job.status?.status === 'indexing' || job.status?.status === 'pending') {
        activeCount++;
      }
    }
    
    // Start new jobs up to the limit
    while (activeCount < maxConcurrentIndexing && indexingQueue.length > 0) {
      const repoId = indexingQueue[0];
      const repo = selectedRepositories.find(r => r.id === repoId);
      
      if (!repo) {
        // Remove from queue if repo not found
        set({ indexingQueue: indexingQueue.slice(1) });
        continue;
      }
      
      // Remove from queue
      set({ indexingQueue: indexingQueue.slice(1) });
      
      // Start indexing
      console.log(`🚀 Starting indexing for ${repo.fullName} (${activeCount + 1}/${maxConcurrentIndexing})`);
      
      try {
        // Get latest commit
        const branches = await githubService.getBranches(repo.owner, repo.name);
        const defaultBranch = branches.branches.find(b => b.name === repo.defaultBranch);
        
        if (defaultBranch) {
          await get().startIndexing(githubService, repo.id, repo.fullName, defaultBranch.commitSha);
          activeCount++;
        }
      } catch (error) {
        console.error(`Failed to start indexing for ${repo.fullName}:`, error);
      }
    }
  },

  /**
   * Disconnect GitHub integration
   * AC#7: Remove GitHub connection
   */
  disconnectGitHub: async (githubService: GitHubService) => {
    set({ isDisconnecting: true, connectionError: null });

    try {
      await githubService.disconnect();
      set({
        githubConnected: false,
        githubConnectionStatus: null,
        githubRepositories: [],
        selectedRepositories: [],
        githubTokenInvalid: false, // Clear token invalid flag
        isDisconnecting: false,
      });
    } catch (error: any) {
      console.error('Failed to disconnect GitHub:', error);
      set({
        connectionError: error.response?.data?.message || 'Failed to disconnect GitHub',
        isDisconnecting: false,
      });
      throw error;
    }
  },

  /**
   * Clear error messages
   */
  clearErrors: () => {
    set({
      connectionError: null,
      repositoriesError: null,
    });
  },

  /**
   * Start indexing a repository
   * Story 4.2 - AC#3: Trigger indexing job
   */
  startIndexing: async (
    githubService: GitHubService,
    repositoryId: number,
    repositoryName: string,
    commitSha: string
  ) => {
    set({ isIndexing: true, indexingError: null });

    try {
      const job = await githubService.startIndexing(repositoryId, repositoryName, commitSha);
      
      const newJobs = new Map(get().indexingJobs);
      newJobs.set(job.indexId, {
        jobId: job.indexId,
        repositoryId,
        repositoryName,
        status: null,
        pollingInterval: null,
      });
      
      set({ indexingJobs: newJobs, isIndexing: false });
      
      // Start polling for status
      get().pollIndexingStatus(githubService, job.indexId);
    } catch (error: any) {
      console.error('Failed to start indexing:', error);
      set({
        indexingError: error.response?.data?.message || 'Failed to start indexing',
        isIndexing: false,
      });
      throw error;
    }
  },

  /**
   * Poll indexing status
   * Story 4.2 - AC#3: Track indexing progress
   */
  pollIndexingStatus: (githubService: GitHubService, indexId: string) => {
    const checkStatus = async () => {
      try {
        const status = await githubService.getIndexingStatus(indexId);
        
        const jobs = new Map(get().indexingJobs);
        const job = jobs.get(indexId);
        
        if (job) {
          job.status = status;
          jobs.set(indexId, job);
          set({ indexingJobs: jobs });
          
          // Stop polling if completed or failed
          if (status.status === 'completed' || status.status === 'failed') {
            get().stopPolling(indexId);
            
            // Process queue when a job completes
            get().processIndexingQueue(githubService);
          }
        }
      } catch (error: any) {
        console.error('Failed to poll indexing status:', error);
        get().stopPolling(indexId);
      }
    };

    // Check immediately
    checkStatus();

    // Then poll every 2 seconds
    const jobs = new Map(get().indexingJobs);
    const job = jobs.get(indexId);
    
    if (job) {
      job.pollingInterval = setInterval(checkStatus, 2000);
      jobs.set(indexId, job);
      set({ indexingJobs: jobs });
    }
  },

  /**
   * Stop polling for a specific index
   */
  stopPolling: (indexId: string) => {
    const jobs = new Map(get().indexingJobs);
    const job = jobs.get(indexId);
    
    if (job?.pollingInterval) {
      clearInterval(job.pollingInterval);
      job.pollingInterval = null;
      jobs.set(indexId, job);
      set({ indexingJobs: jobs });
    }
  },

  /**
   * Clear indexing error
   */
  clearIndexingError: () => {
    set({ indexingError: null });
  },
}));
