import axios from 'axios';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { apiBaseUrl } from './serverUrl';

export const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Quan trọng: Đính kèm cookie (refresh_token)
});

// Request interceptor
api.interceptors.request.use((config) => {
    // Lấy token trực tiếp từ bộ nhớ (Zustand) thay vì localStorage
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - Xử lý Refresh Token Queue
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Không lặp lại nếu API bị lỗi chính là /refresh hoặc /login
            if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Đưa các request tiếp theo vào hàng đợi nếu đang có tiến trình refresh chạy
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi ngầm API làm mới token (Backend tự đọc Cookie)
                const res = await api.post('/auth/refresh');
                const newToken = res.data?.data?.token;
                
                if (newToken) {
                    // Cập nhật State
                    useAuthStore.getState().setAuth(newToken, res.data.data.user);
                    
                    // Gắn token mới và replay request ban đầu
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    processQueue(null, newToken);
                    return api(originalRequest);
                } else {
                    throw new Error("Không nhận được token mới");
                }
            } catch (err) {
                processQueue(err, null);
                // Nếu refresh thất bại, xóa trạng thái đăng nhập
                useAuthStore.getState().logout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
