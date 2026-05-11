/**
 * Client-side Google OAuth using Google Identity Services (GIS).
 * No backend needed — the browser gets an access_token directly.
 *
 * Requires VITE_GOOGLE_CLIENT_ID in env.
 */

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

const TOKEN_KEY = 'gtm-gis-token';
const USER_KEY = 'gtm-gis-user';

export type GoogleUser = {
  email: string;
  name: string;
  picture: string;
  sub: string;
};

type TokenData = {
  access_token: string;
  expires_at: number; // epoch ms
};

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let currentToken: TokenData | null = null;

/* ── Persistence (sessionStorage survives refresh) ───────────── */

function loadStoredToken(): TokenData | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const data: TokenData = JSON.parse(raw);
    if (data.expires_at < Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function storeToken(token: TokenData) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

function loadStoredUser(): GoogleUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeUser(user: GoogleUser) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/* ── Init ────────────────────────────────────────────────────── */

function getClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

function ensureTokenClient(callback: (resp: google.accounts.oauth2.TokenResponse) => void) {
  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: SCOPES,
      callback,
    });
  }
  return tokenClient;
}

/* ── Public API ──────────────────────────────────────────────── */

export function getStoredSession(): { token: TokenData; user: GoogleUser } | null {
  const token = loadStoredToken();
  const user = loadStoredUser();
  if (token && user) {
    currentToken = token;
    return { token, user };
  }
  return null;
}

export function getAccessToken(): string | null {
  if (currentToken && currentToken.expires_at > Date.now()) {
    return currentToken.access_token;
  }
  const stored = loadStoredToken();
  if (stored) {
    currentToken = stored;
    return stored.access_token;
  }
  return null;
}

export function signIn(): Promise<{ token: TokenData; user: GoogleUser }> {
  return new Promise((resolve, reject) => {
    const client = ensureTokenClient(async (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      const tokenData: TokenData = {
        access_token: response.access_token,
        expires_at: Date.now() + response.expires_in * 1000,
      };
      currentToken = tokenData;
      storeToken(tokenData);

      // Fetch user profile
      try {
        const user = await fetchUserProfile(response.access_token);
        storeUser(user);
        resolve({ token: tokenData, user });
      } catch (err) {
        reject(err);
      }
    });
    client.requestAccessToken();
  });
}

export function signOut() {
  const token = getAccessToken();
  if (token) {
    google.accounts.oauth2.revoke(token);
  }
  currentToken = null;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/**
 * Silently refresh the token (no user interaction if consent was previously granted).
 * Returns null if silent refresh fails (user needs to sign in again).
 */
export function refreshToken(): Promise<TokenData | null> {
  return new Promise((resolve) => {
    const client = ensureTokenClient((response) => {
      if (response.error) {
        resolve(null);
        return;
      }
      const tokenData: TokenData = {
        access_token: response.access_token,
        expires_at: Date.now() + response.expires_in * 1000,
      };
      currentToken = tokenData;
      storeToken(tokenData);
      resolve(tokenData);
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function isConfigured(): boolean {
  return !!getClientId();
}

/* ── Internal ────────────────────────────────────────────────── */

async function fetchUserProfile(accessToken: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const data = await res.json();
  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
    sub: data.sub,
  };
}
