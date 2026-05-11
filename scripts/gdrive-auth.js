/**
 * One-time Google Drive OAuth bootstrap.
 *
 * Usage:
 *   node scripts/gdrive-auth.js
 *
 * 1. Reads client_secret_*.json from the app root.
 * 2. Opens a browser to the Google consent screen.
 * 3. Receives the auth code on http://localhost:3000/oauth2callback.
 * 4. Exchanges the code for a refresh token.
 * 5. Prints the env vars to copy into your .env / Easypanel config.
 *
 * The redirect URI http://localhost:3000/oauth2callback MUST be added to
 * your OAuth client's "Authorized redirect URIs" in Google Cloud Console.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { createServer } from 'http';
import { exec } from 'child_process';
import { google } from 'googleapis';

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function findClientSecretFile() {
  return readdirSync('.').find((f) => /^client_secret.*\.json$/.test(f)) || null;
}

function loadCredentials() {
  // Prefer JSON file if present
  const file = findClientSecretFile();
  if (file) {
    const raw = JSON.parse(readFileSync(file, 'utf-8'));
    const creds = raw.web || raw.installed;
    if (creds?.client_id && creds?.client_secret) return creds;
  }
  // Fall back to env vars (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  if (client_id && client_secret) {
    console.log('ℹ️  Using credentials from GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars.\n');
    return { client_id, client_secret };
  }
  console.error('❌ No credentials found. Either:');
  console.error('   • Place a client_secret_*.json file in the project root, OR');
  console.error('   • Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.');
  process.exit(1);
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' :
              process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${url}"`, () => { /* ignore failures, URL is also printed */ });
}

async function main() {
  const { client_id, client_secret } = loadCredentials();

  const oauth2 = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\n🔑 Google Drive OAuth bootstrap');
  console.log(`   Client: ${client_id.slice(0, 20)}...`);
  console.log(`   Redirect URI: ${REDIRECT_URI}`);
  console.log('   (Make sure this exact URI is whitelisted in Google Cloud Console)\n');

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url, `http://localhost:${PORT}`);
      if (u.pathname !== '/oauth2callback') {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const c = u.searchParams.get('code');
      const err = u.searchParams.get('error');
      if (err) {
        res.end(`OAuth error: ${err}. You can close this tab.`);
        server.close();
        reject(new Error(err));
        return;
      }
      if (!c) {
        res.end('Missing code. You can close this tab.');
        server.close();
        reject(new Error('no code'));
        return;
      }
      res.end('✅ Authentication successful! You can close this tab and return to the terminal.');
      server.close();
      resolve(c);
    });
    server.listen(PORT, () => {
      console.log(`👉 Opening browser to authenticate...`);
      console.log(`   If it does not open, visit:\n   ${authUrl}\n`);
      openBrowser(authUrl);
    });
  });

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error('\n❌ No refresh_token returned. This usually means you have already');
    console.error('   authorized this client with this account. Revoke access at');
    console.error('   https://myaccount.google.com/permissions and re-run.');
    process.exit(1);
  }

  // Probe Drive to ensure the token actually works + auto-create the folder
  oauth2.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2 });
  const folderName = 'gtm-workflow-backups';
  const list = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1,
  });
  let folderId;
  if (list.data.files && list.data.files[0]) {
    folderId = list.data.files[0].id;
    console.log(`✅ Reusing existing Drive folder "${folderName}" (id=${folderId})`);
  } else {
    const created = await drive.files.create({
      requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });
    folderId = created.data.id;
    console.log(`✅ Created Drive folder "${folderName}" (id=${folderId})`);
  }

  const envBlock =
`GDRIVE_CLIENT_ID=${client_id}
GDRIVE_CLIENT_SECRET=${client_secret}
GDRIVE_REFRESH_TOKEN=${tokens.refresh_token}
GDRIVE_FOLDER_ID=${folderId}
`;

  console.log('\n──────────────── Add the following to your .env ────────────────\n');
  console.log(envBlock);
  console.log('────────────────────────────────────────────────────────────────\n');

  // Also offer to write/update .env.local automatically
  const envPath = '.env.local';
  if (existsSync(envPath)) {
    // Append GDRIVE vars to .env.local if not already present
    const existing = readFileSync(envPath, 'utf-8');
    if (!existing.includes('GDRIVE_CLIENT_ID')) {
      writeFileSync(envPath, existing.trimEnd() + '\n\n# Google Drive backup\n' + envBlock);
      console.log(`✅ Appended GDRIVE_* vars to ${envPath}`);
    } else {
      console.log(`ℹ️  ${envPath} already contains GDRIVE_* vars — update manually if needed.`);
    }
  } else {
    writeFileSync(envPath, envBlock);
    console.log(`✅ Wrote ${envPath}`);
  }
}

main().catch((err) => {
  console.error('\n❌ Bootstrap failed:', err.message || err);
  process.exit(1);
});
