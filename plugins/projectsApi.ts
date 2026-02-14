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
import { writeFileSync, unlinkSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

function regenerateManifest(dir: string) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .sort();
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');
}

export function projectsApiPlugin(): Plugin {
  const projectsDir = resolve(process.cwd(), 'public', 'projects');

  return {
    name: 'projects-api',
    configureServer(server) {
      // Ensure directory exists
      if (!existsSync(projectsDir)) {
        mkdirSync(projectsDir, { recursive: true });
      }

      server.middlewares.use('/api/projects', (req, res, next) => {
        // Extract filename from URL (e.g. /api/projects/my-project.json → my-project.json)
        const filename = req.url?.replace(/^\//, '') || '';

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
              // Validate JSON
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

        // DELETE — remove project
        if (req.method === 'DELETE') {
          try {
            if (existsSync(filePath)) {
              unlinkSync(filePath);
              regenerateManifest(projectsDir);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, filename }));
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
