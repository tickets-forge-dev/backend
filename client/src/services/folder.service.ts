import { AxiosInstance } from 'axios';
import { createApiClient } from '@/lib/api-client';

export interface FolderResponse {
  id: string;
  name: string;
  teamId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class FolderService {
  private client: AxiosInstance;

  constructor() {
    this.client = createApiClient();
  }

  async list(teamId: string): Promise<FolderResponse[]> {
    const response = await this.client.get<{ success: boolean; folders: FolderResponse[] }>(
      `/teams/${teamId}/folders`,
    );
    return response.data.folders;
  }

  async create(teamId: string, name: string): Promise<FolderResponse> {
    const response = await this.client.post<{ success: boolean; folder: FolderResponse }>(
      `/teams/${teamId}/folders`,
      { name },
    );
    return response.data.folder;
  }

  async rename(teamId: string, folderId: string, name: string): Promise<FolderResponse> {
    const response = await this.client.patch<{ success: boolean; folder: FolderResponse }>(
      `/teams/${teamId}/folders/${folderId}`,
      { name },
    );
    return response.data.folder;
  }

  async delete(teamId: string, folderId: string): Promise<void> {
    await this.client.delete(`/teams/${teamId}/folders/${folderId}`);
  }

  async moveTicket(teamId: string, ticketId: string, folderId: string | null): Promise<void> {
    await this.client.patch(`/teams/${teamId}/folders/move-ticket/${ticketId}`, { folderId });
  }
}
