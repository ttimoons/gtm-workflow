import type { Project } from '../store/types';

const ACTIVE_KEY = 'gtm-workflow-active';
const LOCAL_STORAGE_KEY = 'gtm-workflow-projects';

/* ── Filename helper ──────────────────────────────────────────── */

const FILENAME_PREFIX = 'gtmWorkflow-';

function toFilename(name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled';
  return `${FILENAME_PREFIX}${slug}.json`;
}

/* ── File-based save via dev-server API ────────────────────────── */

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

/* ── Load projects — live directory scan, manifest fallback ───── */

type ProjectWithFilename = Project & { _filename?: string };

async function loadFileProjectsLive(): Promise<ProjectWithFilename[] | null> {
  try {
    const res = await fetch(`/api/projects?t=${Date.now()}`);
    if (!res.ok) return null;
    const data: { projects: ProjectWithFilename[] } = await res.json();
    return data.projects ?? [];
  } catch {
    return null;
  }
}

async function loadFileProjectsFromManifest(): Promise<Project[]> {
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

export async function loadFileProjects(): Promise<ProjectWithFilename[]> {
  // Prefer live endpoint (dev server), fall back to manifest only when API is unavailable.
  const live = await loadFileProjectsLive();
  if (live !== null) return live;
  return loadFileProjectsFromManifest();
}

/* ── Load a single project by ID ───────────────────────────────── */

export async function loadProject(id: string): Promise<Project | null> {
  const projects = await loadFileProjects();
  const fromFile = projects.find((p) => p.id === id);
  if (fromFile) return fromFile;

  const local = getAllLocalProjects();
  return local.find((p) => p.id === id) ?? null;
}

/* ── Get all projects ──────────────────────────────────────────── */

export async function getAllProjects(): Promise<ProjectWithFilename[]> {
  const fileProjects = await loadFileProjects();
  const fileIds = new Set(fileProjects.map((p) => p.id));

  // Only include localStorage projects that don't exist as files
  const localOnly = getAllLocalProjects()
    .filter((p) => !fileIds.has(p.id));

  return [...fileProjects, ...localOnly];
}

/* ── Delete a project ──────────────────────────────────────────── */

export async function deleteProject(id: string): Promise<void> {
  const deletedFiles = new Set<string>();

  // 1. Try by stored filename in localStorage
  const storedFilename = localStorage.getItem(`gtm-file-${id}`);
  if (storedFilename) {
    try {
      await fetch(`/api/projects/${storedFilename}`, { method: 'DELETE' });
      deletedFiles.add(storedFilename);
    } catch { /* ignore */ }
    localStorage.removeItem(`gtm-file-${id}`);
  }

  // 2. Try by _filename from live endpoint (handles renames, missing localStorage)
  try {
    const projects = await loadFileProjects();
    const proj = projects.find((p) => p.id === id);
    if (proj?._filename && !deletedFiles.has(proj._filename)) {
      await fetch(`/api/projects/${proj._filename}`, { method: 'DELETE' });
      deletedFiles.add(proj._filename);
    }
    // 3. Also try derived filename from project name
    if (proj) {
      const derived = toFilename(proj.name);
      if (!deletedFiles.has(derived)) {
        await fetch(`/api/projects/${derived}`, { method: 'DELETE' });
      }
    }
  } catch { /* ignore */ }

  // 4. Last resort: ask server to delete by project ID (scans all files)
  if (deletedFiles.size === 0) {
    try {
      await fetch(`/api/projects/_byid_${encodeURIComponent(id)}.json`, { method: 'DELETE' });
    } catch { /* ignore */ }
  }

  // 5. Always clean up localStorage
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
