import type { ImgHTMLAttributes } from 'react';

interface AvatarUser {
  fullName: string;
  avatarUrl: string | null;
}

interface UserAvatarProps {
  user: AvatarUser | null | undefined;
  className?: string;
  imageProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;
}

export function UserAvatar({ user, className = 'h-10 w-10', imageProps }: UserAvatarProps) {
  const fallback = user?.fullName?.trim().charAt(0).toLocaleUpperCase('vi') || '?';

  return (
    <div
      className={`${className} shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-sm ring-2 ring-white flex items-center justify-center font-bold`}
      aria-label={user ? `Ảnh đại diện của ${user.fullName}` : 'Ảnh đại diện'}
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`Ảnh đại diện của ${user.fullName}`}
          className="h-full w-full object-cover"
          {...imageProps}
        />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </div>
  );
}
