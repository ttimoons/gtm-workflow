import { create } from 'zustand';
import {
  signIn as gisSignIn,
  signOut as gisSignOut,
  getStoredSession,
  isConfigured,
  type GoogleUser,
} from '../utils/googleAuth';
import { clearFolderCache } from '../utils/driveApi';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GoogleUser | null;
  error: string | null;
  checkAuth: () => Promise<void>;
  signIn: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,

  checkAuth: async () => {
    if (!isConfigured()) {
      set({ isAuthenticated: false, isLoading: false, error: 'VITE_GOOGLE_CLIENT_ID not configured' });
      return;
    }
    const session = getStoredSession();
    if (session) {
      set({
        isAuthenticated: true,
        user: session.user,
        isLoading: false,
        error: null,
      });
    } else {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  signIn: async () => {
    try {
      set({ error: null });
      const { user } = await gisSignIn();
      set({ isAuthenticated: true, user, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      set({ error: msg });
    }
  },

  logout: () => {
    gisSignOut();
    clearFolderCache();
    set({ isAuthenticated: false, user: null });
  },
}));
