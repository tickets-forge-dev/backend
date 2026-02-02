/**
 * Settings Store
 * 
 * Manages application settings including GitHub integration state.
 * 
 * Part of: Story 4.1 - Task 10
 * Layer: Client State Management (Zustand)
 */

import { create } from 'zustand';
import { GitHubService, ConnectionStatus, GitHubRepositoryItem } from '@/services/github.service';

interface SettingsState {
  // GitHub Integration State
  githubConnected: boolean;
  githubConnectionStatus: ConnectionStatus | null;
  githubRepositories: GitHubRepositoryItem[];
  selectedRepositories: GitHubRepositoryItem[];
  
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
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial State
  githubConnected: false,
  githubConnectionStatus: null,
  githubRepositories: [],
  selectedRepositories: [],
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
}));
