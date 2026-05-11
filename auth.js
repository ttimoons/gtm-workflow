/**
 * Google sign-in for the production server.
 *
 * Flow:
 *   1. Browser hits /api/auth/google → redirect to Google consent.
 *   2. Google redirects to /api/auth/google/callback?code=... → exchange + verify.
 *   3. We set a signed session cookie containing { sub, email, name } and redirect home.
 *
 * Cookie is HMAC-signed with AUTH_SECRET. No DB; the cookie itself is the session.
 *
 * Env vars:
 *   AUTH_SECRET                — required, ≥32 bytes random hex
 *   AUTH_GOOGLE_CLIENT_ID      — OAuth client ID (can be the same as GDRIVE_CLIENT_ID)
 *   AUTH_GOOGLE_CLIENT_SECRET  — OAuth client secret
 *   AUTH_REDIRECT_URI          — full callback URL, e.g. https://app.example.com/api/auth/google/callback
 *
 * The redirect URI must match exactly what's whitelisted in Google Cloud Console.
 */

import { google } from 'googleapis';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'gtm_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function isAuthEnabled() {
  return Boolean(
    process.env.AUTH_SECRET &&
    process.env.AUTH_GOOGLE_CLIENT_ID &&
    process.env.AUTH_GOOGLE_CLIENT_SECRET &&
    process.env.AUTH_REDIRECT_URI
  );
}

function makeOauthClient() {
  return new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_CLIENT_ID,
    process.env.AUTH_GOOGLE_CLIENT_SECRET,
    process.env.AUTH_REDIRECT_URI
  );
}

/* ── Session token (signed JSON) ─────────────────────────────── */

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    createHmac('sha256', process.env.AUTH_SECRET).update(body).digest()
  );
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const givenSig = token.slice(dot + 1);
  const expectedSig = b64url(
    createHmac('sha256', process.env.AUTH_SECRET).update(body).digest()
  );
  const a = Buffer.from(givenSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(b64urlDecode(body).toString('utf-8'));
    if (data.exp && data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/* ── Cookies ─────────────────────────────────────────────────── */

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((p) => {
      const [k, ...v] = p.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

function setSessionCookie(res, value, secure) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res, secure) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

/* ── State (CSRF) cookie for OAuth ───────────────────────────── */

const STATE_COOKIE = 'gtm_oauth_state';

function setStateCookie(res, value, secure) {
  const parts = [
    `${STATE_COOKIE}=${value}`,
    'Path=/',
    'Max-Age=600',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

/* ── Session lookup for incoming requests ─────────────────────── */

export function getSession(req) {
  const cookies = parseCookies(req);
  return verify(cookies[COOKIE_NAME]);
}

/* ── Route handlers ──────────────────────────────────────────── */

function isSecureRequest(req) {
  return (req.headers['x-forwarded-proto'] === 'https') ||
    (req.connection && req.connection.encrypted);
}

export async function handleAuthRoutes(req, res, pathname) {
  const secure = isSecureRequest(req);

  // Start OAuth: redirect to Google
  if (pathname === '/api/auth/google' && req.method === 'GET') {
    if (!isAuthEnabled()) {
      res.statusCode = 503;
      res.end('Auth not configured');
      return true;
    }
    const state = randomBytes(16).toString('hex');
    setStateCookie(res, state, secure);
    const oauth = makeOauthClient();
    const url = oauth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file'],
      state,
    });
    res.statusCode = 302;
    res.setHeader('Location', url);
    res.end();
    return true;
  }

  // Callback: exchange code, verify ID token, set session, redirect home
  if (pathname === '/api/auth/google/callback' && req.method === 'GET') {
    if (!isAuthEnabled()) {
      res.statusCode = 503;
      res.end('Auth not configured');
      return true;
    }
    const u = new URL(req.url, 'http://localhost');
    const code = u.searchParams.get('code');
    const state = u.searchParams.get('state');
    const cookies = parseCookies(req);
    if (!code || !state || state !== cookies[STATE_COOKIE]) {
      res.statusCode = 400;
      res.end('Invalid OAuth state');
      return true;
    }
    try {
      const oauth = makeOauthClient();
      const { tokens } = await oauth.getToken(code);
      const ticket = await oauth.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.AUTH_GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const session = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
      };
      setSessionCookie(res, sign(session), secure);
      res.statusCode = 302;
      res.setHeader('Location', '/');
      res.end();
    } catch (err) {
      console.error('[auth] callback error:', err.message || err);
      res.statusCode = 500;
      res.end('Authentication failed');
    }
    return true;
  }

  // Current user
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const s = getSession(req);
    res.setHeader('Content-Type', 'application/json');
    if (s) {
      res.end(JSON.stringify({
        authenticated: true,
        email: s.email,
        name: s.name,
        picture: s.picture,
      }));
    } else {
      res.end(JSON.stringify({ authenticated: false }));
    }
    return true;
  }

  // Logout
  if (pathname === '/api/auth/logout' && (req.method === 'POST' || req.method === 'GET')) {
    clearSessionCookie(res, secure);
    if (req.method === 'GET') {
      res.statusCode = 302;
      res.setHeader('Location', '/');
      res.end();
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    }
    return true;
  }

  return false;
}
