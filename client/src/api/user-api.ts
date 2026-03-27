import { AxiosInstance } from 'axios';
import { createApiClient } from '@/lib/api-client';
import { UpdateProfileRequest, UpdateProfileResponse, UserProfile } from '@/src/types/user';

export class UserApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = createApiClient();
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.client.get<{ success: boolean; user: UserProfile }>(
      '/user/profile',
    );
    return response.data.user;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await this.client.put<UpdateProfileResponse>(
      '/user/profile',
      data,
    );
    return response.data.user;
  }
}
