import { create } from 'zustand';

type User = {
  email: string;
  name?: string;
  picture?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  checkAuth: () => Promise<void>;
  signIn: () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!res.ok) {
        set({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }
      const data = await res.json();
      if (data.authenticated) {
        set({
          isAuthenticated: true,
          user: { email: data.email, name: data.name, picture: data.picture },
          isLoading: false,
          error: null,
        });
      } else {
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  signIn: () => {
    window.location.href = '/api/auth/google';
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch { /* ignore */ }
    set({ isAuthenticated: false, user: null });
    window.location.href = '/';
  },
}));
