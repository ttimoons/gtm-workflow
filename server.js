/**
 * Production server for Cloudron / Easypanel deployment.
 * - Serves built static files from ./dist
 * - Implements /api/projects CRUD API (same contract as the Vite dev plugin)
 * - Stores project JSON files in /app/data/projects (mount as persistent volume)
 * - Optional Google Drive backup (auto-restore on empty volume, mirror on save)
 * - Optional Google sign-in gating /api/projects access
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import * as gdrive from './gdrive.js';
import { handleAuthRoutes, getSession, isAuthEnabled } from './auth.js';

const PORT = process.env.PORT || 3000;
const STATIC_DIR = new URL('./dist', import.meta.url).pathname;
// Default to /app/data/projects (Cloudron / Easypanel volume mount).
// Override via DATA_DIR env var when running locally outside Docker.
const DATA_DIR = process.env.DATA_DIR || '/app/data/projects';

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

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

function regenerateManifest() {
  const files = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && f !== 'manifest.json')
    .sort();
  writeFileSync(join(DATA_DIR, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');
}

function readAllProjects() {
  const files = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && f !== 'manifest.json')
    .sort();
  return files.map(file => {
    try {
      return { ...JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8')), _filename: file };
    } catch { return null; }
  }).filter(Boolean);
}

/* ── Drive sync helpers (fire-and-forget; failures only logged) ─ */

let driveFolderId = null;

function mirrorPut(filename, content) {
  if (!gdrive.isEnabled() || !driveFolderId) return;
  gdrive.uploadFile(filename, content, driveFolderId)
    .catch(err => console.error(`[gdrive] upload ${filename} failed:`, err.message || err));
}

function mirrorDelete(filename) {
  if (!gdrive.isEnabled() || !driveFolderId) return;
  gdrive.deleteFile(filename, driveFolderId)
    .catch(err => console.error(`[gdrive] delete ${filename} failed:`, err.message || err));
}

async function bootstrapDrive() {
  if (!gdrive.isEnabled()) {
    console.log('[gdrive] Backup disabled (env vars not set)');
    return;
  }
  try {
    driveFolderId = await gdrive.ensureFolder();
    const localFiles = readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json') && f !== 'manifest.json');

    if (localFiles.length === 0) {
      // Empty volume → restore everything from Drive
      const remote = await gdrive.listFiles(driveFolderId);
      console.log(`[gdrive] Local empty — restoring ${remote.length} files from Drive`);
      for (const f of remote) {
        try {
          const content = await gdrive.downloadFile(f.id);
          writeFileSync(join(DATA_DIR, f.name), content);
        } catch (err) {
          console.error(`[gdrive] restore ${f.name} failed:`, err.message || err);
        }
      }
      regenerateManifest();
    } else {
      // Seed: upload any local file not yet in Drive
      const remote = await gdrive.listFiles(driveFolderId);
      const remoteNames = new Set(remote.map(f => f.name));
      const toSeed = localFiles.filter(f => !remoteNames.has(f));
      if (toSeed.length > 0) {
        console.log(`[gdrive] Seeding ${toSeed.length} local files to Drive`);
        for (const f of toSeed) {
          try {
            await gdrive.uploadFile(f, readFileSync(join(DATA_DIR, f), 'utf-8'), driveFolderId);
          } catch (err) {
            console.error(`[gdrive] seed ${f} failed:`, err.message || err);
          }
        }
      } else {
        console.log(`[gdrive] In sync (${remote.length} files in Drive)`);
      }
    }
  } catch (err) {
    console.error('[gdrive] bootstrap failed — backup disabled for this run:', err.message || err);
    driveFolderId = null;
  }
}

/* ── Auth gating ─────────────────────────────────────────────── */

function requireAuth(req, res) {
  if (!isAuthEnabled()) return true; // auth disabled — allow all
  const session = getSession(req);
  if (!session) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }
  return true;
}

/* ── Project API ─────────────────────────────────────────────── */

function handleApi(req, res, filename) {
  if (!requireAuth(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  // GET /api/projects — list all
  if (req.method === 'GET' && !filename) {
    res.end(JSON.stringify({ projects: readAllProjects() }));
    return;
  }

  if (!filename || !filename.endsWith('.json') || filename === 'manifest.json') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid filename' }));
    return;
  }

  const filePath = join(DATA_DIR, filename);

  // PUT — save project
  if (req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        JSON.parse(body); // validate JSON
        writeFileSync(filePath, body);
        regenerateManifest();
        mirrorPut(filename, body);
        res.end(JSON.stringify({ ok: true, filename }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // DELETE — remove project
  if (req.method === 'DELETE') {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        mirrorDelete(filename);
      }
      // Handle _byid_ pattern (delete by project ID when filename is unknown)
      const idMatch = filename.match(/^_byid_(.+)\.json$/);
      if (idMatch) {
        const targetId = decodeURIComponent(idMatch[1]);
        readdirSync(DATA_DIR)
          .filter(f => f.endsWith('.json') && f !== 'manifest.json')
          .forEach(f => {
            try {
              const proj = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8'));
              if (proj.id === targetId) {
                unlinkSync(join(DATA_DIR, f));
                mirrorDelete(f);
              }
            } catch { /* skip corrupted */ }
          });
      }
      regenerateManifest();
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(err) }));
    }
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

createServer(async (req, res) => {
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
}).listen(PORT, async () => {
  console.log(`GTM Workflow running on port ${PORT}`);
  console.log(`[auth] ${isAuthEnabled() ? 'Google sign-in enabled' : 'Auth disabled (no AUTH_* env vars)'}`);
  await bootstrapDrive();
});
