import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';

export interface JiraConnectionStatus {
  connected: boolean;
  jiraUrl?: string;
  username?: string;
  connectedAt?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraExportResult {
  issueId: string;
  issueKey: string;
  issueUrl: string;
}

export class JiraService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    if (!baseURL) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
    }
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

  async connect(jiraUrl: string, username: string, apiToken: string): Promise<JiraConnectionStatus> {
    const { data } = await this.client.post<JiraConnectionStatus>('/jira/connect', {
      jiraUrl,
      username,
      apiToken,
    });
    return data;
  }

  async getConnectionStatus(): Promise<JiraConnectionStatus> {
    const { data } = await this.client.get<JiraConnectionStatus>('/jira/connection');
    return data;
  }

  async getProjects(): Promise<JiraProject[]> {
    const { data } = await this.client.get<{ projects: JiraProject[] }>('/jira/projects');
    return data.projects;
  }

  async disconnect(): Promise<void> {
    await this.client.delete('/jira/disconnect');
  }

  async exportTicket(ticketId: string, projectKey: string): Promise<JiraExportResult> {
    const { data } = await this.client.post<JiraExportResult>(`/tickets/${ticketId}/export/jira`, { projectKey });
    return data;
  }
}
