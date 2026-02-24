# AGENTS.md

## Cursor Cloud specific instructions

### Overview

GTM Workflow Sandbox is a visual node-based diagramming tool for planning Google Tag Manager implementations. It has two services:

- **Frontend** (React 19 + Vite 7 + TypeScript): the main SPA on port 5173. All core features (canvas, templates, save/load) work without the backend.
- **Backend** (Python Flask): optional API on port 5001 that powers the "Domain Scanner" feature using Playwright/headless Chromium.

### Running services

- **Frontend dev server:** `npm run dev` (port 5173)
- **Backend:** `cd backend && python3 app.py` (port 5001). Requires `pip3 install -r backend/requirements.txt` and `python3 -m playwright install chromium` first.
- Backend health check: `curl http://localhost:5001/health`

### Authentication bypass (dev only)

The app has a client-side auth gate (SHA-256 hash check stored in a cookie). To bypass it for development/testing, set the cookie in the browser console:
```js
document.cookie = 'gtm_auth=b8502bc63671178e21aefdfd14bbc591b19e4764f34f18a680bcf1f29432a6a4; path=/; max-age=2592000; SameSite=Strict';
```
Then reload the page.

### Lint / Build / Test

- **Lint:** `npm run lint` (ESLint 9). There are 5 pre-existing lint errors in the codebase.
- **Build:** `npm run build` (runs `tsc -b && vite build`).
- **No automated test suite** exists in this codebase.

### Gotchas

- `start-dev.sh` has a hardcoded macOS path (`/Users/ttimoon/Dev/gtm-workflow`) — do not use it. Start services manually instead.
- Python packages install to `~/.local/bin` (user install) which may not be on PATH. Add it with `export PATH="$HOME/.local/bin:$PATH"` or invoke via `python3 -m flask` / `python3 app.py`.
