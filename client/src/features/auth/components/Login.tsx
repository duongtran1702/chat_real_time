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
        <div className="app-viewport relative flex items-center justify-center overflow-y-auto bg-[#f0f2f5] px-4 py-6 font-sans antialiased sm:py-10">
            <div className="z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.10)] sm:p-8">
                <div className="mb-8 text-center animate-slide-up sm:mb-10">
                    <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#00b2ff] to-[#006aff] text-white sm:mb-6">
                       <Bot size={42} strokeWidth={1.8} />
                       <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0084ff] ring-4 ring-white">
                         <Sparkles size={15} strokeWidth={2.5} />
                       </span>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">CloseFriend Chat</h2>
                    <p className="text-gray-500 mt-2 font-medium">Đăng nhập để kết nối với bạn bè</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 pl-1">Tài khoản</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <UserIcon size={20} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-11 pr-4 font-medium outline-none transition placeholder-gray-400 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20"
                                placeholder="Nhập username (vd: user123)"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 pl-1">Mật khẩu</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-11 pr-4 font-medium outline-none transition placeholder-gray-400 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20"
                                placeholder="Nhập mật khẩu"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0084ff] px-6 py-3.5 font-bold text-white transition hover:bg-[#0078e8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={22} /> : 'Đăng nhập ngay'}
                    </button>
                </form>
            </div>
        </div>
    );
};
