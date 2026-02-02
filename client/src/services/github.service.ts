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
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
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

