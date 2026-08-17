import { useState } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../../auth/store/useAuthStore';
import { profileService } from '../services/profileService';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png']);

function getErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.';
  }

  const response = (error as { response?: { data?: { message?: string } } }).response;
  return response?.data?.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.';
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return 'Chỉ chấp nhận ảnh PNG, JPG hoặc JPEG.';
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return 'Ảnh đại diện không được vượt quá 5 MB.';
  }
  return null;
}

export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<User | null> => {
    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh đại diện lên...');
    try {
      const updatedUser = await profileService.uploadAvatar(file);
      toast.success('Đã cập nhật ảnh đại diện', { id: toastId });
      return updatedUser;
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadAvatar };
}
