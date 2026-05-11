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
3. Add authorized redirect URI: `http://localhost:5174/api/auth/google/callback`
4. Enable the **Google Drive API** for the project
5. Copy your Client ID and Secret into `.env.local`:

```env
# OAuth credentials
AUTH_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
AUTH_SECRET=random-hex-string-at-least-32-bytes
AUTH_REDIRECT_URI=http://localhost:5174/api/auth/google/callback

# Server
PORT=3001
AUTH_PORT=3001
```

Generate a secure `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Development

```bash
npm install

# Terminal 1 — Auth + Drive API server
npm run dev:server

# Terminal 2 — Vite frontend (proxies /api to server)
npm run dev -- --port 5174
```

The app will be available at `http://localhost:5174`. Sign in with Google to start creating and saving projects.

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

For production deployment, `server.js` serves both the static frontend and the API:

```bash
node --env-file=.env server.js
```

## Tech Stack

- [React 19](https://react.dev) + TypeScript 5.9
- [React Flow](https://reactflow.dev) (`@xyflow/react`) — node-based diagram engine
- [Zustand](https://zustand.docs.pmnd.rs) — state management
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- [Lucide React](https://lucide.dev) — icons
- [Vite 7](https://vite.dev) — build tool & dev server
- [googleapis](https://www.npmjs.com/package/googleapis) — Google Drive API client

## Architecture

```
├── server.js              Auth + Drive API server (production & dev)
├── auth.js                Google OAuth with HMAC-signed cookie sessions
├── gdrive.js              Per-user Drive operations (list, upload, delete)
├── vite.config.ts         Dev server with proxy to auth server
├── .env.local             OAuth credentials (not committed)
│
├── src/
│   ├── App.tsx            Auth gate → loads last project
│   ├── components/        Canvas, Sidebar, Toolbar, ProjectManager, LoginPage
│   ├── nodes/             BaseNode + custom node types (Website, GTM, Tags, etc.)
│   ├── edges/             Animated DataFlowEdge with delete button
│   ├── store/             Zustand (useFlowStore, useAuthStore)
│   ├── data/              Tag registry (icons, colors) + templates
│   └── utils/             storage.ts (Drive API), exportPng, idGenerator
│
├── backend/               Flask domain scanner (optional, local-only)
├── plugins/               Vite dev middleware (local project files, offline mode)
└── scripts/               Build-time utilities
```

### How Storage Works

- Each user signs in with Google OAuth (scopes: `openid`, `email`, `profile`, `drive.file`)
- Session is stored as an HMAC-signed cookie (no database required)
- Projects are saved as individual JSON files in the user's `gtm-workflow-backups` Google Drive folder
- The folder is auto-created on first save
- No localStorage fallback — Drive is the single source of truth

## License

MIT
