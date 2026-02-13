import type { Project } from '../store/types';

const STORAGE_KEY = 'gtm-workflow-projects';
const ACTIVE_KEY = 'gtm-workflow-active';

/* ── localStorage helpers ───────────────────────────────────────── */

export function saveProject(project: Project): void {
  const projects = getAllLocalProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  localStorage.setItem(ACTIVE_KEY, project.id);
}

export function loadProject(id: string): Project | null {
  const projects = getAllLocalProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export function getAllLocalProjects(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function deleteProject(id: string): void {
  const projects = getAllLocalProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

/* ── File-based project loading (from public/projects/) ─────────── */

export async function loadFileProjects(): Promise<Project[]> {
  try {
    const res = await fetch('/projects/manifest.json');
    if (!res.ok) return [];
    const manifest: { files: string[] } = await res.json();

    const projects = await Promise.all(
      manifest.files.map(async (file) => {
        try {
          const r = await fetch(`/projects/${file}`);
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

/**
 * Returns all projects: file-based first, then localStorage-only.
 * File-based projects take priority (by id) over localStorage versions.
 */
export async function getAllProjects(): Promise<Project[]> {
  const fileProjects = await loadFileProjects();
  const localProjects = getAllLocalProjects();

  const fileIds = new Set(fileProjects.map((p) => p.id));
  const localOnly = localProjects.filter((p) => !fileIds.has(p.id));

  return [...fileProjects, ...localOnly];
}

/* ── Export project as JSON file ────────────────────────────────── */

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
