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
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial State
  githubConnected: false,
  githubConnectionStatus: null,
  githubRepositories: [],
  selectedRepositories: [],
  indexingJobs: new Map(),
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

      // If connected, auto-load repositories
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
      });
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
   * AC#5: Save repository selection
   */
  selectRepositories: async (
    githubService: GitHubService,
    repositories: GitHubRepositoryItem[]
  ) => {
    try {
      await githubService.selectRepositories(repositories);
      set({
        selectedRepositories: repositories,
      });
    } catch (error: any) {
      console.error('Failed to select repositories:', error);
      set({
        repositoriesError: error.response?.data?.message || 'Failed to save repository selection',
      });
      throw error; // Re-throw so UI can handle
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
