import { api } from '../../../infra/api';
import type { User } from '../../auth/store/useAuthStore';

interface ApiResponse<T> {
  data: T;
}

export const profileService = {
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<User>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  async updateProfile(fullName: string): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/users/me', { fullName });
    return response.data.data;
  },
};
