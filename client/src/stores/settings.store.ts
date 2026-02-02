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
    set({ isLoadingConnection: true, connectionError: null });
    
    try {
      const status = await githubService.getConnectionStatus();
      set({
        githubConnected: status.connected,
        githubConnectionStatus: status,
        selectedRepositories: status.selectedRepositories || [],
        isLoadingConnection: false,
      });

      // If connected, auto-load repositories and existing indexes
      if (status.connected) {
        get().loadRepositories(githubService);
        get().loadExistingIndexes(githubService);
      }
    } catch (error: any) {
      console.error('Failed to load GitHub status:', error);
      set({
        connectionError: error.response?.data?.message || 'Failed to load GitHub connection status',
        isLoadingConnection: false,
        githubConnected: false,
        githubConnectionStatus: null,
      });
    }
  },

  /**
   * Load existing indexes for selected repositories
   * Shows summaries for completed indexes
   */
  loadExistingIndexes: async (githubService: GitHubService) => {
    try {
      const indexes = await githubService.listIndexes();
      const jobs = new Map(get().indexingJobs);
      
      // Update or create jobs with existing indexes
      for (const index of indexes) {
        // Always update with latest index data (including summary)
        jobs.set(index.repositoryName, {
          jobId: index.indexId,
          repositoryId: index.repositoryName.split('/')[1] ? 0 : 0, // TODO: correlate with repo list
          repositoryName: index.repositoryName,
          indexId: index.indexId,
          status: index,
          pollingInterval: null,
        });
      }
      
      set({ indexingJobs: jobs });
      console.log(`✅ Loaded ${indexes.length} existing indexes with summaries`);
    } catch (error: any) {
      console.error('Failed to load existing indexes:', error);
      // Don't throw - this is graceful degradation
    }
  },

  /**
   * Load user's accessible repositories
   * AC#4: Display repository list
   */
  loadRepositories: async (githubService: GitHubService) => {
    set({ isLoadingRepositories: true, repositoriesError: null });
    
    try {
      const repositories = await githubService.listRepositories();
      set({
        githubRepositories: repositories,
        isLoadingRepositories: false,
      });
    } catch (error: any) {
      console.error('Failed to load repositories:', error);
      set({
        repositoriesError: error.response?.data?.message || 'Failed to load repositories',
        isLoadingRepositories: false,
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
      
      // Redirect to GitHub OAuth
      window.location.href = oauthUrl;
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
      
      // Auto-start indexing ONLY for newly selected repositories
      const newRepos = repositories.filter(repo => !previousIds.has(repo.id));
      
      if (newRepos.length > 0) {
        console.log(`🔄 Auto-queuing ${newRepos.length} newly selected repositories for indexing`);
        get().queueRepositoriesForIndexing(githubService, newRepos);
      } else {
        console.log('ℹ️ No new repositories to index');
      }
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
