import type { Project } from '../store/types';

const STORAGE_KEY = 'gtm-workflow-projects';
const ACTIVE_KEY = 'gtm-workflow-active';

export function saveProject(project: Project): void {
  const projects = getAllProjects();
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
  const projects = getAllProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export function getAllProjects(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function deleteProject(id: string): void {
  const projects = getAllProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}
