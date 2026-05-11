/**
 * Google Drive helpers.
 *
 * Per-user Drive: createUserDriveOps(accessToken, refreshToken, userId)
 * Uses the signed-in user's own OAuth tokens from their session.
 * Each user's projects live in their own gtm-workflow-backups folder.
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_NAME = 'gtm-workflow-backups';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

const userFolderCache = new Map(); // userId (sub) → folderId

function makeOAuth2(accessToken, refreshToken) {
  const auth = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_CLIENT_ID,
    process.env.AUTH_GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return auth;
}

async function findOrCreateFolder(drive) {
  const list = await drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
    pageSize: 1,
  });
  if (list.data.files?.length) return list.data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name: FOLDER_NAME, mimeType: FOLDER_MIME },
    fields: 'id',
  });
  return created.data.id;
}

export function createUserDriveOps(accessToken, refreshToken, userId) {
  const auth = makeOAuth2(accessToken, refreshToken);
  const drive = google.drive({ version: 'v3', auth });

  async function getFolder() {
    if (userFolderCache.has(userId)) return userFolderCache.get(userId);
    const folderId = await findOrCreateFolder(drive);
    userFolderCache.set(userId, folderId);
    return folderId;
  }

  async function findFile(filename) {
    const folderId = await getFolder();
    const escaped = filename.replace(/'/g, "\\'");
    const res = await drive.files.list({
      q: `name='${escaped}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });
    return res.data.files?.[0] ?? null;
  }

  return {
    async listProjects() {
      const folderId = await getFolder();
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false and mimeType='application/json'`,
        fields: 'files(id, name)',
        pageSize: 1000,
      });
      return Promise.all(
        (res.data.files || []).map(async (f) => {
          try {
            const content = await drive.files.get(
              { fileId: f.id, alt: 'media' },
              { responseType: 'json' },
            );
            return { ...content.data, _filename: f.name };
          } catch { return null; }
        })
      ).then(results => results.filter(Boolean));
    },

    async uploadProject(filename, content) {
      const folderId = await getFolder();
      const existing = await findFile(filename);
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
    },

    async deleteProject(filename) {
      const existing = await findFile(filename);
      if (existing) await drive.files.delete({ fileId: existing.id });
    },

    async deleteProjectById(targetId) {
      const folderId = await getFolder();
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false and mimeType='application/json'`,
        fields: 'files(id)',
        pageSize: 1000,
      });
      for (const f of res.data.files || []) {
        try {
          const content = await drive.files.get(
            { fileId: f.id, alt: 'media' },
            { responseType: 'json' },
          );
          if (content.data?.id === targetId) {
            await drive.files.delete({ fileId: f.id });
          }
        } catch { /* skip */ }
      }
    },
  };
}
