import type { Project } from '../store/types';
import {
  listProjects as driveListProjects,
  uploadProject,
  deleteProjectByDriveId,
  deleteProjectByFilename,
  type DriveProject,
} from './driveApi';

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

/* ── Save project to Drive ────────────────────────────────────── */

export async function saveProject(project: Project): Promise<void> {
  const filename = toFilename(project.name);
  const json = JSON.stringify(project, null, 2);

  await uploadProject(filename, json);

  // Track filename mapping for rename detection
  const oldFilename = localStorage.getItem(`gtm-file-${project.id}`);
  if (oldFilename && oldFilename !== filename) {
    deleteProjectByFilename(oldFilename).catch(() => {});
  }
  localStorage.setItem(`gtm-file-${project.id}`, filename);
  localStorage.setItem(ACTIVE_KEY, project.id);
}

/* ── Load projects from Drive ─────────────────────────────────── */

export async function loadFileProjects(): Promise<DriveProject[]> {
  try {
    const projects = await driveListProjects();

    // Deduplicate by project ID — keep the most recently updated copy
    const byId = new Map<string, DriveProject>();
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

export async function getAllProjects(): Promise<DriveProject[]> {
  return loadFileProjects();
}

/* ── Delete a project ──────────────────────────────────────────── */

export async function deleteProject(id: string): Promise<void> {
  const projects = await loadFileProjects();
  const proj = projects.find((p) => p.id === id);

  if (proj?._driveFileId) {
    await deleteProjectByDriveId(proj._driveFileId);
  } else if (proj?._filename) {
    await deleteProjectByFilename(proj._filename);
  } else {
    // Try by stored filename
    const storedFilename = localStorage.getItem(`gtm-file-${id}`);
    if (storedFilename) {
      await deleteProjectByFilename(storedFilename);
    }
  }

  localStorage.removeItem(`gtm-file-${id}`);
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
