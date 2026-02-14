import type { Project } from '../store/types';

const ACTIVE_KEY = 'gtm-workflow-active';
const LOCAL_STORAGE_KEY = 'gtm-workflow-projects';

/* ── Filename helper ──────────────────────────────────────────── */

function toFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  ) + '.json';
}

/* ── File-based save via dev-server API ────────────────────────── */

/**
 * Save project as a JSON file in public/projects/.
 * Falls back to localStorage if the API is unavailable (production build).
 */
export async function saveProject(project: Project): Promise<void> {
  const filename = toFilename(project.name);
  const json = JSON.stringify(project, null, 2);

  try {
    const res = await fetch(`/api/projects/${filename}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
    if (res.ok) {
      // Handle rename: delete old file if name changed
      const oldFilename = localStorage.getItem(`gtm-file-${project.id}`);
      if (oldFilename && oldFilename !== filename) {
        fetch(`/api/projects/${oldFilename}`, { method: 'DELETE' }).catch(() => {});
      }
      localStorage.setItem(`gtm-file-${project.id}`, filename);
      localStorage.setItem(ACTIVE_KEY, project.id);
      return;
    }
  } catch {
    // API not available — fall back to localStorage
  }

  // Fallback: localStorage
  const projects = getAllLocalProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  localStorage.setItem(ACTIVE_KEY, project.id);
}

/* ── Load projects from public/projects/ ───────────────────────── */

export async function loadFileProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`/projects/manifest.json?t=${Date.now()}`);
    if (!res.ok) return [];
    const manifest: { files: string[] } = await res.json();

    const projects = await Promise.all(
      manifest.files.map(async (file) => {
        try {
          const r = await fetch(`/projects/${file}?t=${Date.now()}`);
          if (!r.ok) return null;
          return (await r.json()) as Project;
        } catch {
          return null;
        }
      })
    );

    return projects.filter((p): p is Project => p !== null);
  } catch {
    return [];
  }
}

/* ── Load a single project by ID ───────────────────────────────── */

export async function loadProject(id: string): Promise<Project | null> {
  const projects = await loadFileProjects();
  const fromFile = projects.find((p) => p.id === id);
  if (fromFile) return fromFile;

  // Fallback: localStorage
  const local = getAllLocalProjects();
  return local.find((p) => p.id === id) ?? null;
}

/* ── Get all projects ──────────────────────────────────────────── */

export async function getAllProjects(): Promise<Project[]> {
  const fileProjects = await loadFileProjects();
  const localProjects = getAllLocalProjects();

  const fileIds = new Set(fileProjects.map((p) => p.id));
  const localOnly = localProjects.filter((p) => !fileIds.has(p.id));

  return [...fileProjects, ...localOnly];
}

/* ── Delete a project ──────────────────────────────────────────── */

export async function deleteProject(id: string): Promise<void> {
  // Try to delete the file via API
  const filename = localStorage.getItem(`gtm-file-${id}`);
  if (filename) {
    try {
      await fetch(`/api/projects/${filename}`, { method: 'DELETE' });
      localStorage.removeItem(`gtm-file-${id}`);
    } catch {
      // Ignore
    }
  }

  // Also try to find by manifest and delete by matching id
  try {
    const projects = await loadFileProjects();
    const proj = projects.find((p) => p.id === id);
    if (proj) {
      const fn = toFilename(proj.name);
      await fetch(`/api/projects/${fn}`, { method: 'DELETE' });
    }
  } catch {
    // Ignore
  }

  // Also remove from localStorage fallback
  const localProjects = getAllLocalProjects().filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localProjects));
}

/* ── localStorage helpers (fallback only) ─────────────────────── */

function getAllLocalProjects(): Project[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

/* ── Export project as downloaded JSON ─────────────────────────── */

export function downloadProjectJson(project: {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
}): void {
  const now = new Date().toISOString();
  const data = { ...project, updatedAt: now, createdAt: now };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
