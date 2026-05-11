/**
 * Vite plugin that provides a dev-server API for saving/deleting
 * project JSON files in public/projects/ and auto-regenerating manifest.json.
 *
 * Endpoints:
 *   PUT  /api/projects/:filename   — write/overwrite a project JSON file
 *   DELETE /api/projects/:filename — delete a project JSON file
 *
 * After each mutation the manifest.json is regenerated automatically.
 */

import { type Plugin } from 'vite';
import { writeFileSync, readFileSync, unlinkSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

function regenerateManifest(dir: string) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .sort();
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');
}

function readAllProjects(dir: string): unknown[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .sort();
  const projects: unknown[] = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), 'utf-8');
      const proj = JSON.parse(raw);
      projects.push({ ...proj, _filename: file });
    } catch {
      // Skip corrupted files
    }
  }
  return projects;
}

export function projectsApiPlugin(): Plugin {
  const projectsDir = resolve(process.cwd(), 'public', 'projects');
  // When an auth server is configured, yield all /api/projects requests to the Vite proxy.
  const useAuthServer = !!process.env.AUTH_PORT;

  return {
    name: 'projects-api',
    configureServer(server) {
      if (!existsSync(projectsDir)) {
        mkdirSync(projectsDir, { recursive: true });
      }

      // Prevent full-page reloads when project files are saved via API.
      // The app reads projects through this API directly in dev mode.
      server.watcher.unwatch(projectsDir);
      server.watcher.unwatch(join(projectsDir, '**', '*'));

      server.middlewares.use('/api/projects', (req, res, next) => {
        if (useAuthServer) return next(); // let proxy handle it

        const filename = req.url?.replace(/^\//, '').split('?')[0] || '';

        // GET /api/projects — list all projects (live directory scan)
        if (req.method === 'GET' && !filename) {
          try {
            const projects = readAllProjects(projectsDir);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ projects }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        if (!filename || !filename.endsWith('.json') || filename === 'manifest.json') {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid filename' }));
          return;
        }

        const filePath = join(projectsDir, filename);

        // PUT — save project
        if (req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              JSON.parse(body);
              writeFileSync(filePath, body);
              regenerateManifest(projectsDir);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, filename }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        // DELETE — remove project file
        if (req.method === 'DELETE') {
          try {
            if (existsSync(filePath)) {
              unlinkSync(filePath);
            }
            // Also try to find and delete by project ID (handles renamed files)
            const idMatch = filename.match(/^_byid_(.+)\.json$/);
            if (idMatch) {
              const targetId = decodeURIComponent(idMatch[1]);
              const files = readdirSync(projectsDir)
                .filter((f) => f.endsWith('.json') && f !== 'manifest.json');
              for (const f of files) {
                try {
                  const raw = readFileSync(join(projectsDir, f), 'utf-8');
                  const proj = JSON.parse(raw);
                  if (proj.id === targetId) {
                    unlinkSync(join(projectsDir, f));
                  }
                } catch { /* skip */ }
              }
            }
            regenerateManifest(projectsDir);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        next();
      });
    },
  };
}
