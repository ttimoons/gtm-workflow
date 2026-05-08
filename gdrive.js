/**
 * Google Drive backup helpers.
 *
 * All credentials come from environment variables:
 *   GDRIVE_CLIENT_ID
 *   GDRIVE_CLIENT_SECRET
 *   GDRIVE_REFRESH_TOKEN
 *   GDRIVE_FOLDER_ID    (optional — auto-created on first use if absent)
 *
 * Run scripts/gdrive-auth.js once to obtain the refresh token.
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_NAME = 'gtm-workflow-backups';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

let driveClient = null;
let cachedFolderId = null;

export function isEnabled() {
  return Boolean(
    process.env.GDRIVE_CLIENT_ID &&
    process.env.GDRIVE_CLIENT_SECRET &&
    process.env.GDRIVE_REFRESH_TOKEN
  );
}

function getDrive() {
  if (driveClient) return driveClient;
  const auth = new google.auth.OAuth2(
    process.env.GDRIVE_CLIENT_ID,
    process.env.GDRIVE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export async function ensureFolder() {
  if (cachedFolderId) return cachedFolderId;
  if (process.env.GDRIVE_FOLDER_ID) {
    cachedFolderId = process.env.GDRIVE_FOLDER_ID;
    return cachedFolderId;
  }

  const drive = getDrive();
  const list = await drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1,
  });
  if (list.data.files && list.data.files.length > 0) {
    cachedFolderId = list.data.files[0].id;
    console.log(`[gdrive] Reusing folder ${FOLDER_NAME} (id=${cachedFolderId})`);
  } else {
    const created = await drive.files.create({
      requestBody: { name: FOLDER_NAME, mimeType: FOLDER_MIME },
      fields: 'id',
    });
    cachedFolderId = created.data.id;
    console.log(`[gdrive] Created folder ${FOLDER_NAME} (id=${cachedFolderId})`);
  }
  console.log(`[gdrive] Pin this folder by setting GDRIVE_FOLDER_ID=${cachedFolderId}`);
  return cachedFolderId;
}

async function findFile(filename, folderId) {
  const drive = getDrive();
  const escaped = filename.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name='${escaped}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
  });
  return res.data.files && res.data.files[0] ? res.data.files[0] : null;
}

export async function uploadFile(filename, content, folderId) {
  const drive = getDrive();
  const existing = await findFile(filename, folderId);
  const media = { mimeType: 'application/json', body: Readable.from([content]) };

  if (existing) {
    await drive.files.update({ fileId: existing.id, media });
  } else {
    await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media,
      fields: 'id',
    });
  }
}

export async function deleteFile(filename, folderId) {
  const drive = getDrive();
  const existing = await findFile(filename, folderId);
  if (existing) {
    await drive.files.delete({ fileId: existing.id });
  }
}

export async function listFiles(folderId) {
  const drive = getDrive();
  const all = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and mimeType='application/json'`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: 1000,
      pageToken,
    });
    all.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}

export async function downloadFile(fileId) {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  );
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
}
