import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';

export interface LinearConnectionStatus {
  connected: boolean;
  userName?: string;
  teamId?: string | null;
  teamName?: string | null;
  connectedAt?: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearExportResult {
  issueId: string;
  issueUrl: string;
  identifier: string;
}

export class LinearService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    this.client = axios.create({ baseURL, timeout: 30000 });

    this.client.interceptors.request.use(async (config) => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getOAuthUrl(): Promise<string> {
    const { data } = await this.client.get<{ oauthUrl: string }>('/linear/oauth/authorize');
    return data.oauthUrl;
  }

  async getConnectionStatus(): Promise<LinearConnectionStatus> {
    const { data } = await this.client.get<LinearConnectionStatus>('/linear/oauth/connection');
    return data;
  }

  async getTeams(): Promise<LinearTeam[]> {
    const { data } = await this.client.get<{ teams: LinearTeam[] }>('/linear/oauth/teams');
    return data.teams;
  }

  async disconnect(): Promise<void> {
    await this.client.post('/linear/oauth/disconnect');
  }

  async exportTicket(ticketId: string, teamId: string): Promise<LinearExportResult> {
    const { data } = await this.client.post<LinearExportResult>(`/tickets/${ticketId}/export/linear`, { teamId });
    return data;
  }

  /**
   * Search for Linear issues by ID or title
   * Used for autocomplete in import wizard
   */
  async searchIssues(query: string): Promise<
    Array<{ id: string; identifier: string; title: string }>
  > {
    try {
      const { data } = await this.client.get('/linear/issues/search', {
        params: { query },
      });
      return data.issues || [];
    } catch {
      // If endpoint doesn't exist, return empty array
      return [];
    }
  }

  /**
   * Import Linear issue and create draft ticket
   */
  async importIssue(issueId: string): Promise<{
    ticketId: string;
    importedFrom: { platform: 'linear'; issueId: string; issueUrl: string };
  }> {
    const { data } = await this.client.post('/tickets/import/linear', { issueId });
    return data;
  }
}
