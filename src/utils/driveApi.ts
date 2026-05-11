/**
 * Client-side Google Drive API.
 * Calls the Drive REST API directly from the browser using the user's access token.
 * All projects are stored in a "gtm-workflow-backups" folder in the user's Drive.
 */

import { getAccessToken, refreshToken } from './googleAuth';

const FOLDER_NAME = 'gtm-workflow-backups';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

let cachedFolderId: string | null = null;

/* ── Auth helper ──────────────────────────────────────────────── */

async function getToken(): Promise<string> {
  let token = getAccessToken();
  if (!token) {
    const refreshed = await refreshToken();
    if (!refreshed) throw new Error('Not authenticated');
    token = refreshed.access_token;
  }
  return token;
}

async function driveRequest(url: string, init?: RequestInit): Promise<Response> {
  let token = await getToken();
  let res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });

  // If 401, try refreshing token once
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (!refreshed) throw new Error('Session expired — please sign in again');
    token = refreshed.access_token;
    res = await fetch(url, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    });
  }

  return res;
}

/* ── Folder management ────────────────────────────────────────── */

async function findOrCreateFolder(): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  // Search for existing folder
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`);
  const listRes = await driveRequest(
    `${DRIVE_API}/files?q=${q}&fields=files(id)&spaces=drive&pageSize=1`
  );
  if (!listRes.ok) throw new Error('Failed to search Drive folders');
  const listData = await listRes.json();

  if (listData.files?.length) {
    cachedFolderId = listData.files[0].id;
    return cachedFolderId!;
  }

  // Create folder
  const createRes = await driveRequest(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
  });
  if (!createRes.ok) throw new Error('Failed to create Drive folder');
  const createData = await createRes.json();
  cachedFolderId = createData.id;
  return cachedFolderId!;
}

/* ── Public API ──────────────────────────────────────────────── */

export type DriveProject = {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
  createdAt?: string;
  updatedAt?: string;
  _driveFileId?: string;
  _filename?: string;
};

export async function listProjects(): Promise<DriveProject[]> {
  const folderId = await findOrCreateFolder();
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType='application/json'`);
  const listRes = await driveRequest(
    `${DRIVE_API}/files?q=${q}&fields=files(id,name)&pageSize=1000`
  );
  if (!listRes.ok) throw new Error('Failed to list projects');
  const listData = await listRes.json();
  const files: { id: string; name: string }[] = listData.files || [];

  const projects = await Promise.all(
    files.map(async (f) => {
      try {
        const res = await driveRequest(`${DRIVE_API}/files/${f.id}?alt=media`);
        if (!res.ok) return null;
        const data = await res.json();
        return { ...data, _driveFileId: f.id, _filename: f.name } as DriveProject;
      } catch {
        return null;
      }
    })
  );

  return projects.filter(Boolean) as DriveProject[];
}

export async function uploadProject(filename: string, content: string): Promise<void> {
  const folderId = await findOrCreateFolder();

  // Check for existing file with same name
  const escaped = filename.replace(/'/g, "\\'");
  const q = encodeURIComponent(`name='${escaped}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await driveRequest(
    `${DRIVE_API}/files?q=${q}&fields=files(id)&pageSize=1`
  );
  const searchData = await searchRes.json();
  const existing = searchData.files?.[0];

  if (existing) {
    // Update existing file
    const res = await driveRequest(`${UPLOAD_API}/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    });
    if (!res.ok) throw new Error('Failed to update project');
  } else {
    // Create new file (multipart upload)
    const metadata = { name: filename, parents: [folderId] };
    const boundary = '---gtm-workflow-boundary';
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');

    const res = await driveRequest(`${UPLOAD_API}/files?uploadType=multipart`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) throw new Error('Failed to create project');
  }
}

export async function deleteProjectByDriveId(driveFileId: string): Promise<void> {
  const res = await driveRequest(`${DRIVE_API}/files/${driveFileId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete project');
}

export async function deleteProjectByFilename(filename: string): Promise<void> {
  const folderId = await findOrCreateFolder();
  const escaped = filename.replace(/'/g, "\\'");
  const q = encodeURIComponent(`name='${escaped}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await driveRequest(
    `${DRIVE_API}/files?q=${q}&fields=files(id)&pageSize=1`
  );
  const searchData = await searchRes.json();
  const existing = searchData.files?.[0];
  if (existing) {
    await deleteProjectByDriveId(existing.id);
  }
}

export function clearFolderCache() {
  cachedFolderId = null;
}
