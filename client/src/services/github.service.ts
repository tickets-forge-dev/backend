import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';

export interface RepositoryInfo {
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  description: string | null;
}

export interface BranchInfo {
  name: string;
  isDefault: boolean;
  commitSha: string;
  lastCommit: {
    sha: string;
    author: string | null;
    date: string;
    message: string;
  };
}

export interface BranchesResponse {
  branches: BranchInfo[];
  defaultBranch: string;
  totalCount: number;
}

// Story 4.1: OAuth integration types
export interface OAuthUrlResponse {
  oauthUrl: string;
  state: string;
}

export interface ConnectionStatus {
  connected: boolean;
  accountLogin?: string;
  accountType?: 'User' | 'Organization';
  connectedAt?: string;
  selectedRepositoryCount?: number;
  selectedRepositories?: GitHubRepositoryItem[];
}

export interface GitHubRepositoryItem {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  url: string;
  updatedAt?: string;
}

export interface RepositoriesResponse {
  repositories: GitHubRepositoryItem[];
  totalCount: number;
}

// Story 4.2: Code Indexing types
export interface IndexSummary {
  languagesDetected: string[];
  hasDocumentation: boolean;
  hasTests: boolean;
  hasApiSpec: boolean;
  documentationFiles: string[];
  testFiles: string[];
  configFiles: string[];
}

export interface IndexJob {
  indexId: string;
  message: string;
}

export interface IndexStatus {
  indexId: string;
  repositoryId: number;
  repositoryName: string;
  status: 'pending' | 'indexing' | 'completed' | 'failed';
  filesIndexed: number;
  totalFiles: number;
  filesSkipped: number;
  parseErrors: number;
  progress: number;
  repoSizeMB: number;
  createdAt: string;
  completedAt?: string;
  indexDurationMs: number;
  summary?: IndexSummary;
  errorDetails?: {
    type: string;
    message: string;
  };
}

export interface IndexStats {
  totalFiles: number;
  filesIndexed: number;
  filesSkipped: number;
  parseErrors: number;
  languages: Record<string, number>;
  successRate: number;
}

export class GitHubService {
  private client: AxiosInstance;

  constructor() {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      withCredentials: true, // Required for session cookies
    });

    // Add Firebase ID token to all requests
    this.client.interceptors.request.use(async (config) => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Force refresh if this is a retry (marked by custom header)
          const forceRefresh = config.headers['X-Token-Refresh'] === 'true';
          const token = await user.getIdToken(forceRefresh);
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`🔐 [GitHubService] Added auth token to request: ${config.url}${forceRefresh ? ' (refreshed)' : ''}`);
        } else {
          console.warn('⚠️ [GitHubService] No auth user found for request:', config.url);
        }
      } catch (error) {
        console.error('❌ [GitHubService] Failed to get auth token:', error);
      }
      return config;
    });

    // Auto-retry 401 errors with refreshed token
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and haven't retried yet, refresh token and retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest.headers['X-Token-Refresh'] = 'true';
          console.log('🔄 [GitHubService] Got 401, refreshing token and retrying...');
          return this.client(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get repository information including default branch
   * AC#6: GET /api/github/repos/:owner/:repo
   */
  async getRepository(owner: string, repo: string): Promise<RepositoryInfo> {
    const response = await this.client.get<RepositoryInfo>(
      `/github/repos/${owner}/${repo}`
    );
    return response.data;
  }

  /**
   * Get list of branches with metadata
   * AC#6: GET /api/github/repos/:owner/:repo/branches
   */
  async getBranches(owner: string, repo: string): Promise<BranchesResponse> {
    const response = await this.client.get<BranchesResponse>(
      `/github/repos/${owner}/${repo}/branches`
    );
    return response.data;
  }

  // ==================== OAuth Integration (Story 4.1) ====================

  /**
   * Get GitHub OAuth authorization URL
   * AC#2: Initiate OAuth flow
   */
  async getOAuthUrl(): Promise<string> {
    const response = await this.client.get<OAuthUrlResponse>(
      '/github/oauth/authorize'
    );
    return response.data.oauthUrl;
  }

  /**
   * Get GitHub connection status
   * AC#1: Check if GitHub is connected
   */
  async getConnectionStatus(): Promise<ConnectionStatus> {
    const response = await this.client.get<ConnectionStatus>(
      '/github/oauth/connection'
    );
    return response.data;
  }

  /**
   * List user's accessible repositories (requires OAuth connection)
   * AC#4: Fetch repository list
   */
  async listRepositories(): Promise<GitHubRepositoryItem[]> {
    const response = await this.client.get<RepositoriesResponse>(
      '/github/oauth/repositories'
    );
    return response.data.repositories;
  }

  /**
   * Select repositories for indexing
   * AC#5: Save repository selection
   */
  async selectRepositories(repositories: GitHubRepositoryItem[]): Promise<void> {
    await this.client.post('/github/oauth/repositories/select', {
      repositories,
    });
  }

  /**
   * Disconnect GitHub integration
   * AC#7: Remove connection
   */
  async disconnect(): Promise<void> {
    await this.client.post('/github/oauth/disconnect');
  }

  /**
   * Start indexing for a repository
   * Story 4.2 - AC#3: Trigger indexing job
   */
  async startIndexing(
    repositoryId: number,
    repositoryName: string,
    commitSha: string
  ): Promise<IndexJob> {
    const response = await this.client.post<IndexJob>('/indexing/start', {
      repositoryId,
      repositoryName,
      commitSha,
    }, {
      timeout: 120000, // 2 minutes for git clone + indexing to start
    });
    return response.data;
  }

  /**
   * Get indexing status
   * Story 4.2 - AC#3: Poll indexing progress
   */
  async getIndexingStatus(indexId: string): Promise<IndexStatus> {
    const response = await this.client.get<IndexStatus>(
      `/indexing/status/${indexId}`
    );
    return response.data;
  }

  /**
   * List all indexes for a repository or all repositories
   * Story 4.2: View index status
   */
  async listIndexes(repositoryId?: number): Promise<IndexStatus[]> {
    try {
      const params = repositoryId ? { repositoryId } : {};
      const response = await this.client.get<IndexStatus[]>(
        '/indexing/list',
        { 
          params,
          timeout: 10000 // 10 second timeout
        }
      );
      return response.data;
    } catch (error) {
      console.error('[GitHubService.listIndexes] Error:', error);
      // Return empty array for graceful degradation
      return [];
    }
  }

  /**
   * Get index statistics
   * Story 4.2: View language breakdown and quality metrics
   */
  async getIndexStats(indexId: string): Promise<IndexStats> {
    const response = await this.client.get<IndexStats>(
      `/indexing/stats/${indexId}`
    );
    return response.data;
  }

  /**
   * Cancel/remove a stuck or failed indexing job
   */
  async cancelIndexing(indexId: string): Promise<void> {
    await this.client.delete(`/indexing/${indexId}`);
  }

  /**
   * Retry a failed indexing job
   */
  async retryIndexing(repositoryId: number, repositoryName: string, commitSha?: string): Promise<IndexJob> {
    // If no commitSha provided, use 'HEAD' as default
    return this.startIndexing(repositoryId, repositoryName, commitSha || 'HEAD');
  }

  /**
   * Parse repository full name into owner and repo
   */
  static parseRepoFullName(fullName: string): { owner: string; repo: string } | null {
    const parts = fullName.split('/');
    if (parts.length !== 2) {
      return null;
    }
    return { owner: parts[0], repo: parts[1] };
  }
}

