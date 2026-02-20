import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';
import type { DesignReference } from '@repo/shared-types';

export interface CreateTicketRequest {
  title: string;
  description?: string;
  repositoryFullName?: string;
  branchName?: string;
  type?: string;
  priority?: string;
}

export interface AttachmentResponse {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  storagePath: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AECResponse {
  id: string;
  workspaceId: string;
  status: string;
  title: string;
  description: string | null;
  type: string | null;
  priority: string | null;
  assignedTo: string | null; // Story 3.5-5: User ID of assigned developer (null if unassigned)
  readinessScore: number;
  generationState: {
    currentStep: number;
    steps: Array<{
      id: number;
      title: string;
      status: string;
      details?: string;
      error?: string;
    }>;
  };
  acceptanceCriteria: string[];
  assumptions: string[];
  repoPaths: string[];
  questions: any[];
  estimate: any | null;
  validationResults: any[];
  // Iterative question refinement workflow fields
  questionRounds?: any[]; // QuestionRound[] from backend
  currentRound?: number; // Current round number (1-N or 0 if not started)
  maxRounds?: number; // Adaptive max rounds (0-3, default 3)
  techSpec?: any; // TechSpec | null
  externalIssue?: { platform: 'linear' | 'jira'; issueId: string; issueUrl: string } | null;
  attachments?: AttachmentResponse[];
  designReferences?: any[]; // DesignReference[] from @repo/shared-types
  // Repository context (null if ticket created without repository)
  repositoryContext?: {
    repositoryFullName: string; // "owner/repo"
    branchName: string;
    commitSha: string;
    isDefaultBranch: boolean;
    selectedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export class TicketService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
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

  async create(data: CreateTicketRequest): Promise<AECResponse> {
    try {
      const response = await this.client.post<AECResponse>('/tickets', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async getById(id: string): Promise<AECResponse> {
    const response = await this.client.get<AECResponse>(`/tickets/${id}`);
    return response.data;
  }

  async list(): Promise<AECResponse[]> {
    const response = await this.client.get<AECResponse[]>('/tickets');
    return response.data;
  }

  async update(
    id: string,
    data: { description?: string; acceptanceCriteria?: string[]; assumptions?: string[]; status?: 'draft' | 'complete'; techSpec?: Record<string, any> },
  ): Promise<AECResponse> {
    const response = await this.client.patch<AECResponse>(
      `/tickets/${id}`,
      data,
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/tickets/${id}`);
  }

  async getQuota(): Promise<{ used: number; limit: number; canCreate: boolean }> {
    const response = await this.client.get<{ used: number; limit: number; canCreate: boolean }>('/tickets/quota');
    return response.data;
  }

  async detectApis(ticketId: string): Promise<DetectApisResponse> {
    const response = await this.client.post<DetectApisResponse>(`/tickets/${ticketId}/detect-apis`);
    return response.data;
  }

  async exportMarkdown(ticketId: string): Promise<string> {
    const response = await this.client.get<string>(`/tickets/${ticketId}/export/markdown`, {
      responseType: 'text',
    });
    return response.data;
  }

  async exportXml(ticketId: string): Promise<string> {
    const response = await this.client.get<string>(`/tickets/${ticketId}/export/xml`, {
      responseType: 'text',
    });
    return response.data;
  }

  async exportToJira(ticketId: string, projectKey: string, sections?: string[]): Promise<{ issueId: string; issueKey: string; issueUrl: string }> {
    const response = await this.client.post<{ issueId: string; issueKey: string; issueUrl: string }>(
      `/tickets/${ticketId}/export/jira`,
      { projectKey, sections },
    );
    return response.data;
  }

  async exportToLinear(ticketId: string, teamId: string): Promise<{ issueId: string; issueUrl: string; identifier: string }> {
    const response = await this.client.post<{ issueId: string; issueUrl: string; identifier: string }>(
      `/tickets/${ticketId}/export/linear`,
      { teamId },
    );
    return response.data;
  }

  async uploadAttachment(
    ticketId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<AttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<AttachmentResponse>(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (event) => {
              if (event.total) {
                onProgress(Math.round((event.loaded * 100) / event.total));
              }
            }
          : undefined,
      },
    );
    return response.data;
  }

  async deleteAttachment(ticketId: string, attachmentId: string): Promise<void> {
    await this.client.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
  }

  async addDesignReference(
    ticketId: string,
    request: { url: string; title?: string },
  ): Promise<{ designReference: any }> {
    // Trim URL and title to remove whitespace
    const trimmedRequest = {
      url: request.url.trim(),
      title: request.title?.trim(),
    };
    const response = await this.client.post(
      `/tickets/${ticketId}/design-references`,
      trimmedRequest,
    );
    return response.data;
  }

  async removeDesignReference(ticketId: string, referenceId: string): Promise<void> {
    await this.client.delete(`/tickets/${ticketId}/design-references/${referenceId}`);
  }

  async refreshDesignReference(ticketId: string, referenceId: string): Promise<{ designReference: DesignReference }> {
    const response = await this.client.post<{ designReference: DesignReference }>(
      `/tickets/${ticketId}/design-references/${referenceId}/refresh`
    );
    return response.data;
  }

  // Story 3.5-5: Assign ticket to developer
  async assign(ticketId: string, userId: string | null): Promise<{ success: boolean }> {
    const response = await this.client.patch<{ success: boolean }>(
      `/tickets/${ticketId}/assign`,
      { userId }
    );
    return response.data;
  }
}

export interface DetectedApiResponse {
  id: string;
  status: 'existing' | 'new' | 'modified' | 'delete';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  request: { shape: string; example?: Record<string, unknown> };
  response: { shape: string; example?: Record<string, unknown> };
  description: string;
  sourceFile?: string;
  curlCommand: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DetectApisResponse {
  apis: DetectedApiResponse[];
  count: number;
  repository: string;
  branch: string;
}
