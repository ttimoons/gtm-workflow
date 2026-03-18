/**
 * Production server for Cloudron deployment.
 * - Serves built static files from /app/code
 * - Implements /api/projects CRUD API (same contract as the Vite dev plugin)
 * - Stores project JSON files in /app/data/projects (Cloudron persistent volume)
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const PORT = process.env.PORT || 3000;
const STATIC_DIR = new URL('./dist', import.meta.url).pathname;
const DATA_DIR = '/app/data/projects';

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

function handleApi(req, res, filename) {
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
      if (existsSync(filePath)) unlinkSync(filePath);
      // Handle _byid_ pattern (delete by project ID when filename is unknown)
      const idMatch = filename.match(/^_byid_(.+)\.json$/);
      if (idMatch) {
        const targetId = decodeURIComponent(idMatch[1]);
        readdirSync(DATA_DIR)
          .filter(f => f.endsWith('.json') && f !== 'manifest.json')
          .forEach(f => {
            try {
              const proj = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8'));
              if (proj.id === targetId) unlinkSync(join(DATA_DIR, f));
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

createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (pathname.startsWith('/api/projects')) {
    const filename = pathname.replace(/^\/api\/projects\/?/, '');
    handleApi(req, res, filename);
  } else {
    handleStatic(req, res, pathname);
  }
}).listen(PORT, () => {
  console.log(`GTM Workflow running on port ${PORT}`);
});
