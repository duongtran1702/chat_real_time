import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, ImagePlus, Loader2, Save, UserRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../../auth/store/useAuthStore';
import { UserAvatar } from '../../chat';
import { useAvatarUpload, validateAvatarFile } from '../hooks/useAvatarUpload';
import { normalizeFullName, useProfileInfoUpdate, validateFullName } from '../hooks/useProfileInfoUpdate';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdated: (updatedUser: User) => void;
}

export function ProfileModal({ user, onClose, onUpdated }: ProfileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user.fullName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadAvatar } = useAvatarUpload();
  const { isUpdating, updateProfile } = useProfileInfoUpdate();
  const isBusy = isUploading || isUpdating;

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, onClose]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    const updatedUser = await uploadAvatar(selectedFile);
    if (updatedUser) {
      onUpdated(updatedUser);
      onClose();
    }
  };

  const handleProfileSave = async () => {
    const updatedUser = await updateProfile(fullName);
    if (updatedUser) {
      setFullName(updatedUser.fullName);
      onUpdated(updatedUser);
    }
  };

  const previewUser = { ...user, fullName: normalizeFullName(fullName) || user.fullName, avatarUrl: previewUrl || user.avatarUrl };
  const fullNameError = fullName === user.fullName ? null : validateFullName(fullName);
  const hasNameChanged = normalizeFullName(fullName) !== user.fullName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="max-h-[94dvh] w-full max-w-sm overflow-y-auto rounded-t-[28px] border border-white/70 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6 sm:py-5">
          <div>
            <h2 id="avatar-modal-title" className="text-lg font-bold text-gray-900">Hồ sơ cá nhân</h2>
            <p className="mt-1 text-xs text-gray-500">Cập nhật tên hiển thị và ảnh đại diện</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
            aria-label="Đóng cửa sổ đổi ảnh"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:py-7">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            className="group relative rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed"
            aria-label="Chọn ảnh đại diện mới"
          >
            <UserAvatar user={previewUser} className="h-24 w-24 sm:h-28 sm:w-28" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45 text-white opacity-0 transition group-hover:opacity-100">
              <Camera size={28} />
            </span>
            <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-md">
              <ImagePlus size={16} />
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />

          <p className="mt-5 max-w-full truncate text-sm font-medium text-gray-700">
            {selectedFile?.name || 'Nhấp vào ảnh để chọn tệp mới'}
          </p>

          <p className="mt-1 text-xs text-gray-400">PNG, JPG hoặc JPEG · tối đa 5 MB</p>

          <div className="mt-6 w-full border-t border-gray-100 pt-5">
            <label htmlFor="profile-username" className="mb-1.5 block text-xs font-semibold text-gray-600">
              Tên đăng nhập
            </label>
            <div className="relative">
              <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="profile-username"
                value={user.username}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-100 py-2.5 pl-10 pr-3 text-sm text-gray-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">Tên đăng nhập dùng để xác thực nên không thể thay đổi.</p>

            <label htmlFor="profile-full-name" className="mb-1.5 mt-4 block text-xs font-semibold text-gray-600">
              Tên hiển thị
            </label>
            <input
              id="profile-full-name"
              value={fullName}
              maxLength={100}
              disabled={isBusy}
              onChange={(event) => setFullName(event.target.value)}
              className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:ring-4 ${
                fullNameError
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
              }`}
            />
            {fullNameError && <p className="mt-1.5 text-xs text-red-500">{fullNameError}</p>}

            <button
              type="button"
              onClick={() => void handleProfileSave()}
              disabled={!hasNameChanged || Boolean(fullNameError) || isBusy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isUpdating ? 'Đang cập nhật...' : 'Lưu thông tin'}
            </button>
          </div>

          <div className="mt-5 flex w-full gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selectedFile || isBusy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}
              {isUploading ? 'Đang tải...' : 'Lưu ảnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
