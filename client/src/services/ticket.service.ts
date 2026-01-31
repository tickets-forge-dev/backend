import axios, { AxiosInstance } from 'axios';

export interface CreateTicketRequest {
  title: string;
  description?: string;
}

export interface AECResponse {
  id: string;
  workspaceId: string;
  status: string;
  title: string;
  description: string | null;
  type: string | null;
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
  }

  async create(data: CreateTicketRequest): Promise<AECResponse> {
    try {
      const response = await this.client.post<AECResponse>('/tickets', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create ticket. Please try again.');
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
    data: { acceptanceCriteria?: string[]; assumptions?: string[] },
  ): Promise<AECResponse> {
    const response = await this.client.patch<AECResponse>(
      `/tickets/${id}`,
      data,
    );
    return response.data;
  }
}
