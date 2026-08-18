import React, { useEffect, useState } from 'react';
import { api } from '../../../infra/api';
import { AUTH_SESSION_MARKER_KEY, useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export const AuthInit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, setAuth, logout } = useAuthStore();
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                // Thử gọi /refresh ngầm để nhận token mới từ cookie
                const response = await api.post('/auth/refresh');
                const newToken = response.data?.data?.token;
                
                if (newToken && isMounted) {
                    setAuth(newToken, response.data.data.user);
                }
            } catch {
                // Nếu refresh thất bại (chưa login hoặc token quá hạn), xóa trạng thái rác
                if (isMounted) {
                    logout();
                }
            } finally {
                if (isMounted) {
                    setIsInitializing(false);
                }
            }
        };

        const hasRefreshSession = localStorage.getItem(AUTH_SESSION_MARKER_KEY) === 'true';

        if (!token && hasRefreshSession) {
            initializeAuth();
        } else {
            if (!token) {
                logout();
            }
            setIsInitializing(false);
        }

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isInitializing) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="text-gray-500 font-medium">Đang xác thực phiên đăng nhập...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
