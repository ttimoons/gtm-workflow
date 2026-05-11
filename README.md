# GTM Workflow Sandbox

A visual node-based diagramming tool for planning Google Tag Manager implementations. Drag-and-drop GTM components onto a canvas, connect them to map data flow, and save architectures to your Google Drive.

![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

## Features

- **Google OAuth sign-in** — each user authenticates with their Google account
- **Google Drive persistence** — projects auto-save to your personal `gtm-workflow-backups` Drive folder (one JSON per project)
- **Drag-and-drop nodes** from the sidebar onto the canvas
- **Connect components** by dragging between handles to visualize data flow
- **Pre-built templates** for common GTM architectures (GA4, Server-Side CAPI, E-commerce, Hybrid)
- **Domain scanner** — automatically detect tags on any website (including GTM-injected tags) and import them to canvas
- **JSON export/import** to share architectures with your team
- **PNG export** of canvas diagrams

### Available Components

| Category | Components |
|----------|-----------|
| **Infrastructure** | Website / Data Layer, GTM Client Container, GTM Server Container, Data Stream |
| **Tags** | GA4, Meta Pixel, Google Ads, TikTok, LinkedIn, Pinterest, Snapchat, X (Twitter), Custom HTML, Floodlight, Hotjar, Microsoft Clarity, CMP |
| **Logic** | Triggers, Variables |
| **Annotations** | Zone (resizable colored group boxes) |

### Templates

1. **Basic GA4 Setup** — Website → GTM Client → GA4
2. **Server-Side with Facebook CAPI** — Website → GTM Client → GTM Server → GA4 + Meta CAPI + Google Ads
3. **Multi-Platform E-commerce** — GA4 + Meta + TikTok + LinkedIn via client-side GTM
4. **Hybrid Client + Server** — Client-side analytics + server-side conversion tracking

## Getting Started

### Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Frontend + auth/API server |
| **npm** | 9+ | Package management |
| **Python** | 3.9+ | Backend for domain scanner (optional) |

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origin: `http://localhost:5173`
4. Enable the **Google Drive API** for the project
5. Copy your Client ID into `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

> **Note:** Authentication uses client-side [Google Identity Services](https://developers.google.com/identity/gsi/web) (GIS). The browser gets an access token directly from Google — no server-side secret or redirect URI needed for development or static deployments.

### Development

```bash
npm install

# Vite frontend (the only server you need)
npm run dev
```

The app will be available at `http://localhost:5173`. Sign in with Google to start creating and saving projects.

### Self-hosted Production Server (optional)

For Docker / Cloudron / Easypanel deployments, the server-side auth proxy handles OAuth via redirect:

```env
AUTH_SECRET=random-hex-string-at-least-32-bytes
AUTH_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
AUTH_REDIRECT_URI=https://your-app.example.com/api/auth/google/callback
```

Generate a secure `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
npm run build
node --env-file=.env server.js
```

### Domain Scanner (optional)

The domain scanner uses a local Flask + Playwright backend to detect tags on websites:

```bash
cd backend
pip3 install -r requirements.txt
python3 -m playwright install chromium
python3 app.py
```

> **Note:** The domain scanner backend is local-only and not deployed to production.

### Build for Production

```bash
npm run build    # TypeScript check + Vite build → dist/
npm run preview  # Preview production build
```

The output `dist/` folder is fully static — deploy it anywhere.

## Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ttimoons/gtm-workflow)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ttimoons/gtm-workflow&env=VITE_GOOGLE_CLIENT_ID&envDescription=Google%20OAuth%20Client%20ID%20for%20Drive%20access&project-name=gtm-workflow)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ttimoons/gtm-workflow)

### Environment Variable

All platforms require one build-time env var:

| Variable | Value |
|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID (e.g. `123456-abc.apps.googleusercontent.com`) |

### Google Cloud Console Setup

After deploying, add your production domain to your OAuth client:

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client → **Authorized JavaScript origins**
3. Add your deployed URL (e.g. `https://gtm-workflow.netlify.app`)

### Platform-specific Notes

| Platform | Build command | Publish directory |
|----------|--------------|-------------------|
| **Netlify** | `npm run build` | `dist` |
| **Vercel** | `npm run build` | `dist` |
| **GitHub Pages** | `npm run build` | `dist` (use `base: '/gtm-workflow/'` in vite.config.ts) |

## Tech Stack

- [React 19](https://react.dev) + TypeScript 5.9
- [React Flow](https://reactflow.dev) (`@xyflow/react`) — node-based diagram engine
- [Zustand](https://zustand.docs.pmnd.rs) — state management
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- [Lucide React](https://lucide.dev) — icons
- [Vite 7](https://vite.dev) — build tool & dev server
- [Google Identity Services](https://developers.google.com/identity/gsi/web) — client-side OAuth
- [Google Drive REST API](https://developers.google.com/drive/api/v3/reference) — project persistence

## Architecture

```
├── index.html             Entry point (loads GIS script)
├── vite.config.ts         Build config
├── .env.local             VITE_GOOGLE_CLIENT_ID (not committed)
│
├── src/
│   ├── App.tsx            Auth gate → loads last project
│   ├── components/        Canvas, Sidebar, Toolbar, ProjectManager, LoginPage
│   ├── nodes/             BaseNode + custom node types (Website, GTM, Tags, etc.)
│   ├── edges/             Animated DataFlowEdge with delete button
│   ├── store/             Zustand (useFlowStore, useAuthStore)
│   ├── data/              Tag registry (icons, colors) + templates
│   └── utils/
│       ├── googleAuth.ts  GIS token client (sign-in, refresh, sign-out)
│       ├── driveApi.ts    Direct Drive API (list, upload, delete)
│       ├── storage.ts     Project persistence layer (uses driveApi)
│       └── exportPng.ts   Canvas-to-PNG export
│
├── server.js              Self-hosted production server (auth + Drive proxy)
├── auth.js                Server-side OAuth (for Docker/Cloudron/Easypanel)
├── gdrive.js              Server-side Drive ops (per-user tokens from session)
├── backend/               Flask domain scanner (optional, local-only)
└── plugins/               Vite dev middleware (offline/local mode)
```

### How Storage Works

- User signs in via Google popup (GIS token model) — no server redirect needed
- Access token stored in `sessionStorage` (cleared on tab close)
- Projects saved as individual JSON files in user's `gtm-workflow-backups` Drive folder
- Folder is auto-created on first save
- Token auto-refreshes silently; re-prompts user if consent expired

## License

MIT
