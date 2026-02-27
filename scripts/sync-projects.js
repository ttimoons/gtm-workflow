#!/usr/bin/env node

/**
 * Scans public/projects/ for .json project files and generates
 * public/projects/manifest.json so the app can discover them at runtime.
 *
 * Runs automatically before dev/build/preview via npm scripts.
 * Also run manually: npm run sync-projects
 */

import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectsDir = join(__dirname, '..', 'public', 'projects');

if (!existsSync(projectsDir)) {
  mkdirSync(projectsDir, { recursive: true });
}

const files = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  .sort();

writeFileSync(
  join(projectsDir, 'manifest.json'),
  JSON.stringify({ files }, null, 2) + '\n'
);

console.log(`✓ manifest.json synced (${files.length} project${files.length !== 1 ? 's' : ''})`);
