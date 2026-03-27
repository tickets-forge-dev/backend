import { AxiosInstance } from 'axios';
import { createApiClient } from '@/lib/api-client';
import { UpdateProfileRequest, UpdateProfileResponse, AvatarResponse, UserProfile } from '@/src/types/user';

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

  async uploadAvatar(file: File): Promise<AvatarResponse['user']> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.client.post<AvatarResponse>(
      '/user/profile/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.user;
  }

  async setAvatarEmoji(emoji: string): Promise<AvatarResponse['user']> {
    const response = await this.client.put<AvatarResponse>(
      '/user/profile/avatar/emoji',
      { emoji },
    );
    return response.data.user;
  }

  async removeAvatar(): Promise<AvatarResponse['user']> {
    const response = await this.client.delete<AvatarResponse>(
      '/user/profile/avatar',
    );
    return response.data.user;
  }
}
