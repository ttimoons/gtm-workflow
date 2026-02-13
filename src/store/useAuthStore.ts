import { create } from 'zustand';

const EXPECTED_HASH = 'b8502bc63671178e21aefdfd14bbc591b19e4764f34f18a680bcf1f29432a6a4';
const SALT = 'gtm-antilop-salt';
const COOKIE_NAME = 'gtm_auth';
const COOKIE_MAX_AGE = 2592000; // 30 days

/* ── Cookie helpers ─────────────────────────────────────────────── */

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' ? '; Secure' : '';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict${secure}`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
}

/* ── SHA-256 helper ─────────────────────────────────────────────── */

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ── Auth store ─────────────────────────────────────────────────── */

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: () => {
    const cookie = getCookie(COOKIE_NAME);
    set({
      isAuthenticated: cookie === EXPECTED_HASH,
      isLoading: false,
    });
  },

  login: async (username: string, password: string) => {
    const hash = await sha256(`${username}:${password}:${SALT}`);
    if (hash === EXPECTED_HASH) {
      setCookie(COOKIE_NAME, hash, COOKIE_MAX_AGE);
      set({ isAuthenticated: true, error: null });
    } else {
      set({ error: 'Invalid username or password' });
    }
  },

  logout: () => {
    deleteCookie(COOKIE_NAME);
    set({ isAuthenticated: false, error: null });
  },
}));
