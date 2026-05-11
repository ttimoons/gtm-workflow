import type { Project } from '../store/types';

const ACTIVE_KEY = 'gtm-workflow-active';

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

/* ── Save project to server (→ Drive) ─────────────────────────── */

export async function saveProject(project: Project): Promise<void> {
  const filename = toFilename(project.name);
  const json = JSON.stringify(project, null, 2);

  const res = await fetch(`/api/projects/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: json,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to save project');
  }

  // Track filename mapping for rename detection
  const oldFilename = localStorage.getItem(`gtm-file-${project.id}`);
  if (oldFilename && oldFilename !== filename) {
    fetch(`/api/projects/${oldFilename}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    }).catch(() => {});
  }
  localStorage.setItem(`gtm-file-${project.id}`, filename);
  localStorage.setItem(ACTIVE_KEY, project.id);
}

/* ── Load projects from server (→ Drive) ──────────────────────── */

type ProjectWithFilename = Project & { _filename?: string };

export async function loadFileProjects(): Promise<ProjectWithFilename[]> {
  try {
    const res = await fetch(`/api/projects?t=${Date.now()}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return [];
    const data: { projects: ProjectWithFilename[] } = await res.json();
    const projects = data.projects ?? [];

    // Deduplicate by project ID — keep the most recently updated copy
    const byId = new Map<string, ProjectWithFilename>();
    for (const p of projects) {
      const existing = byId.get(p.id);
      if (!existing || (p.updatedAt && (!existing.updatedAt || p.updatedAt > existing.updatedAt))) {
        byId.set(p.id, p);
      }
    }
    return Array.from(byId.values());
  } catch {
    return [];
  }
}

/* ── Load a single project by ID ───────────────────────────────── */

export async function loadProject(id: string): Promise<Project | null> {
  const projects = await loadFileProjects();
  return projects.find((p) => p.id === id) ?? null;
}

/* ── Get all projects ──────────────────────────────────────────── */

export async function getAllProjects(): Promise<ProjectWithFilename[]> {
  return loadFileProjects();
}

/* ── Delete a project ──────────────────────────────────────────── */

export async function deleteProject(id: string): Promise<void> {
  // 1. Try by stored filename
  const storedFilename = localStorage.getItem(`gtm-file-${id}`);
  if (storedFilename) {
    await fetch(`/api/projects/${storedFilename}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    }).catch(() => {});
    localStorage.removeItem(`gtm-file-${id}`);
  }

  // 2. Try by _filename from list
  const projects = await loadFileProjects();
  const proj = projects.find((p) => p.id === id);
  if (proj?._filename && proj._filename !== storedFilename) {
    await fetch(`/api/projects/${proj._filename}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    }).catch(() => {});
  }

  // 3. Fallback: delete by project ID
  if (!storedFilename && !proj?._filename) {
    await fetch(`/api/projects/_byid_${encodeURIComponent(id)}.json`, {
      method: 'DELETE',
      credentials: 'same-origin',
    }).catch(() => {});
  }
}

/* ── Active project tracking ──────────────────────────────────── */

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
