import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';

export interface CreateTicketRequest {
  title: string;
  description?: string;
  repositoryFullName?: string;
  branchName?: string;
  type?: string;
  priority?: string;
}

export interface AECResponse {
  id: string;
  workspaceId: string;
  status: string;
  title: string;
  description: string | null;
  type: string | null;
  priority: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export class TicketService {
  private client: AxiosInstance;

  constructor() {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
    console.log('🎫 [TicketService] Creating ticket:', data);

    try {
      const user = auth.currentUser;
      console.log('🎫 [TicketService] Current user:', user?.email || 'none');
      console.log('🎫 [TicketService] API URL:', this.client.defaults.baseURL);

      const response = await this.client.post<AECResponse>('/tickets', data);
      console.log('🎫 [TicketService] Ticket created:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ [TicketService] Create failed');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      console.error('Full error:', error);

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
