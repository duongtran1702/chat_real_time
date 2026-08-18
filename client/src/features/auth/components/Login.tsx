import React, { useState } from 'react';
import { api } from '../../../infra/api';
import { useAuthStore } from '../store/useAuthStore';
import { Bot, Loader2, Lock, Sparkles, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const setAuth = useAuthStore(state => state.setAuth);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { username, password });
            if (response.data.success) {
                toast.success('Đăng nhập thành công!');
                setAuth(response.data.data.token, response.data.data.user);
            } else {
                toast.error(response.data.message || 'Đăng nhập thất bại');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-viewport login-bg relative flex items-center justify-center overflow-y-auto px-4 py-6 font-sans antialiased sm:py-10">
            {/* Floating decorative blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="animate-blob-1 absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="animate-blob-2 absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/8 blur-3xl" />
                <div className="animate-blob-2 absolute left-1/3 top-1/4 h-48 w-48 rounded-full bg-purple-300/10 blur-2xl" />
            </div>

            <div className="z-10 w-full max-w-md rounded-3xl border border-white/30 bg-white/85 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-8">
                <div className="mb-8 text-center animate-slide-up sm:mb-10">
                    <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0066ff] to-[#7048e8] text-white shadow-lg shadow-blue-500/25 sm:mb-6">
                       <Bot size={42} strokeWidth={1.8} />
                       <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0066ff] shadow-md ring-2 ring-white">
                         <Sparkles size={15} strokeWidth={2.5} />
                       </span>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">CloseFriend Chat</h2>
                    <p className="text-gray-500 mt-2 font-medium">Đăng nhập để kết nối với bạn bè</p>
                </div>

                <form onSubmit={handleLogin} autoComplete="off" className="space-y-5 sm:space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 pl-1">Tài khoản</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <UserIcon size={20} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập tên tài khoản"
                                autoComplete="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                className="w-full rounded-xl border border-gray-200/80 bg-white/70 py-3.5 pl-11 pr-4 font-medium outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#0066ff]/40 focus:bg-white focus:ring-4 focus:ring-[#0066ff]/10 focus:shadow-[0_0_0_1px_rgba(0,102,255,0.1)]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 pl-1">Mật khẩu</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                autoComplete="off"
                                className="w-full rounded-xl border border-gray-200/80 bg-white/70 py-3.5 pl-11 pr-4 font-medium outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#0066ff]/40 focus:bg-white focus:ring-4 focus:ring-[#0066ff]/10 focus:shadow-[0_0_0_1px_rgba(0,102,255,0.1)]"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#5c7cfa] px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                    >
                        {loading ? <Loader2 className="animate-spin" size={22} /> : 'Đăng nhập ngay'}
                    </button>
                </form>
            </div>
        </div>
    );
};
