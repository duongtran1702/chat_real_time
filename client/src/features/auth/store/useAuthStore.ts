import { create } from 'zustand';

export const AUTH_SESSION_MARKER_KEY = 'hasRefreshSession';

export interface User {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    online: boolean;
}

interface AuthState {
    token: string | null;
    currentUser: User | null;
    setAuth: (token: string, user: User) => void;
    updateUser: (user: User) => void;
    updateProfile: (profile: Pick<User, 'fullName' | 'avatarUrl'>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
    setAuth: (token, user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem(AUTH_SESSION_MARKER_KEY, 'true');
        set({ token, currentUser: user });
    },
    updateUser: (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        set({ currentUser: user });
    },
    updateProfile: (profile) => set((state) => {
        if (!state.currentUser) return state;
        const currentUser = { ...state.currentUser, ...profile };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return { currentUser };
    }),
    logout: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem(AUTH_SESSION_MARKER_KEY);
        set({ token: null, currentUser: null });
    },
}));
