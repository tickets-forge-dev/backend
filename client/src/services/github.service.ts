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
