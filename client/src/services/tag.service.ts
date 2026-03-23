import { AxiosInstance } from 'axios';
import { createApiClient } from '@/lib/api-client';

export interface TagResponse {
  id: string;
  name: string;
  color: string;
  scope: 'team' | 'private';
  teamId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class TagService {
  private client: AxiosInstance;

  constructor() {
    this.client = createApiClient();
  }

  async list(teamId: string): Promise<TagResponse[]> {
    const response = await this.client.get<{ success: boolean; tags: TagResponse[] }>(
      `/teams/${teamId}/tags`,
    );
    return response.data.tags;
  }

  async create(teamId: string, name: string, color: string, scope?: 'team' | 'private'): Promise<TagResponse> {
    const response = await this.client.post<{ success: boolean; tag: TagResponse }>(
      `/teams/${teamId}/tags`,
      { name, color, scope },
    );
    return response.data.tag;
  }

  async update(teamId: string, tagId: string, data: { name?: string; color?: string }): Promise<TagResponse> {
    const response = await this.client.patch<{ success: boolean; tag: TagResponse }>(
      `/teams/${teamId}/tags/${tagId}`,
      data,
    );
    return response.data.tag;
  }

  async delete(teamId: string, tagId: string): Promise<void> {
    await this.client.delete(`/teams/${teamId}/tags/${tagId}`);
  }
}
