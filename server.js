/**
 * Production server for Cloudron / Easypanel deployment.
 * - Serves built static files from ./dist
 * - Implements /api/projects CRUD API backed by the signed-in user's Google Drive
 * - Each user's projects live in their own gtm-workflow-backups Drive folder
 * - Google sign-in required (AUTH_* env vars)
 */

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createUserDriveOps } from './gdrive.js';
import { handleAuthRoutes, getSession, isAuthEnabled } from './auth.js';

const PORT = process.env.PORT || 3000;
const STATIC_DIR = new URL('./dist', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
};

/* ── Auth gating ─────────────────────────────────────────────── */

function getAuthSession(req, res) {
  if (!isAuthEnabled()) return { noDrive: true };
  const session = getSession(req);
  if (!session) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return null;
  }
  return session;
}

function getUserDriveOps(session) {
  if (session?.access_token) {
    return createUserDriveOps(session.access_token, session.refresh_token, session.sub);
  }
  return null;
}

/* ── Project API (Drive-only) ────────────────────────────────── */

function handleApi(req, res, filename) {
  res.setHeader('Content-Type', 'application/json');

  const session = getAuthSession(req, res);
  if (session === null) return; // already sent 401

  const userDrive = getUserDriveOps(session);

  if (!userDrive) {
    // Session exists but no Drive tokens — user signed in before Drive scope was added
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Drive not authorized — please sign out and sign in again.' }));
    return;
  }

  // GET /api/projects — list all from Drive
  if (req.method === 'GET' && !filename) {
    console.log(`[drive] listProjects for ${session.email}`);
    userDrive.listProjects()
      .then(projects => {
        console.log(`[drive] listed ${projects.length} projects for ${session.email}`);
        res.end(JSON.stringify({ projects }));
      })
      .catch(err => {
        console.error('[drive] listProjects failed:', err.message);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  if (!filename || !filename.endsWith('.json') || filename === 'manifest.json') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid filename' }));
    return;
  }

  // PUT — save project to Drive
  if (req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        JSON.parse(body); // validate JSON
        console.log(`[drive] upload ${filename} for ${session.email}`);
        userDrive.uploadProject(filename, body)
          .then(() => {
            console.log(`[drive] uploaded ${filename} ok`);
            res.end(JSON.stringify({ ok: true, filename }));
          })
          .catch(err => {
            console.error(`[drive] upload ${filename} failed:`, err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // DELETE — remove project from Drive
  if (req.method === 'DELETE') {
    const idMatch = filename.match(/^_byid_(.+)\.json$/);
    const deleteOp = idMatch
      ? userDrive.deleteProjectById(decodeURIComponent(idMatch[1]))
      : userDrive.deleteProject(filename);

    deleteOp
      .then(() => res.end(JSON.stringify({ ok: true })))
      .catch(err => {
        console.error(`[drive] delete ${filename} failed:`, err.message);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

function handleStatic(req, res, pathname) {
  let filePath = join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
  try {
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(STATIC_DIR, 'index.html'); // SPA fallback
    }
    const content = readFileSync(filePath);
    res.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream');
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  // Auth routes (login, callback, me, logout)
  if (pathname.startsWith('/api/auth/')) {
    const handled = await handleAuthRoutes(req, res, pathname);
    if (handled) return;
  }

  if (pathname.startsWith('/api/projects')) {
    const filename = pathname.replace(/^\/api\/projects\/?/, '');
    handleApi(req, res, filename);
  } else {
    handleStatic(req, res, pathname);
  }
});

/* ── Startup ──────────────────────────────────────────────────── */

console.log(`[auth] ${isAuthEnabled() ? 'Google sign-in enabled' : 'Auth disabled (no AUTH_* env vars)'}`);
server.listen(PORT, () => {
  console.log(`GTM Workflow running on port ${PORT}`);
});
