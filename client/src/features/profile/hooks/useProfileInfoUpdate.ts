import { useState } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../../auth/store/useAuthStore';
import { profileService } from '../services/profileService';

const FULL_NAME_PATTERN = /^(?=.*\p{L})[\p{L}\p{M} .'-]+$/u;

function getErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Không thể cập nhật thông tin. Vui lòng thử lại.';
  }

  const response = (error as { response?: { data?: { message?: string } } }).response;
  return response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.';
}

export function normalizeFullName(fullName: string) {
  return fullName.trim().replace(/\s+/g, ' ');
}

export function validateFullName(fullName: string): string | null {
  const normalizedName = normalizeFullName(fullName);
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    return 'Tên hiển thị phải có từ 2 đến 100 ký tự.';
  }
  if (!FULL_NAME_PATTERN.test(normalizedName)) {
    return 'Tên hiển thị chỉ được chứa chữ cái, khoảng trắng, dấu chấm, dấu nháy hoặc gạch nối.';
  }
  return null;
}

export function useProfileInfoUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (fullName: string): Promise<User | null> => {
    const validationError = validateFullName(fullName);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    setIsUpdating(true);
    const toastId = toast.loading('Đang cập nhật thông tin...');
    try {
      const updatedUser = await profileService.updateProfile(normalizeFullName(fullName));
      toast.success('Đã cập nhật thông tin', { id: toastId });
      return updatedUser;
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { isUpdating, updateProfile };
}
