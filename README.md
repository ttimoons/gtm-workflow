# GTM Workflow Sandbox

A visual node-based diagramming tool for planning Google Tag Manager implementations. Drag-and-drop GTM components onto a canvas, connect them to map data flow, and save your architecture as reusable templates.

![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

## Features

- **Drag-and-drop nodes** from the sidebar onto the canvas
- **Connect components** by dragging between handles to visualize data flow
- **Pre-built templates** for common GTM architectures (GA4, Server-Side CAPI, E-commerce, Hybrid)
- **Auto-save** to localStorage with manual save/export/import
- **JSON export/import** to share architectures with your team

### Available Components

| Category | Components |
|----------|-----------|
| **Infrastructure** | Website / Data Layer, GTM Client Container, GTM Server Container, Data Stream |
| **Tags** | GA4, Meta Pixel, Google Ads, TikTok, LinkedIn, Pinterest, Snapchat, X (Twitter), Custom HTML, Floodlight, Hotjar, Microsoft Clarity |
| **Logic** | Triggers, Variables |

### Templates

1. **Basic GA4 Setup** — Website → GTM Client → GA4
2. **Server-Side with Facebook CAPI** — Website → GTM Client → GTM Server → GA4 + Meta CAPI + Google Ads
3. **Multi-Platform E-commerce** — GA4 + Meta + TikTok + LinkedIn via client-side GTM
4. **Hybrid Client + Server** — Client-side analytics + server-side conversion tracking

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- [React 19](https://react.dev) + TypeScript
- [React Flow](https://reactflow.dev) (`@xyflow/react`) — node-based diagram engine
- [Zustand](https://zustand.docs.pmnd.rs) — state management
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- [Lucide React](https://lucide.dev) — icons
- [Vite](https://vite.dev) — build tool

## Deploy

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/gtm-workflow)

1. Push this repo to GitHub
2. Go to [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Connect your GitHub repo
4. Build settings are auto-detected:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy**

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/gtm-workflow)

1. Push this repo to GitHub
2. Go to [Vercel](https://vercel.com/new) → **Import** your repo
3. Settings are auto-detected — click **Deploy**

### StackBlitz

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/YOUR_USERNAME/gtm-workflow)

Once the repo is on GitHub, replace `YOUR_USERNAME` in the URL above, or just go to:

```
https://stackblitz.com/github/YOUR_USERNAME/gtm-workflow
```

### GitHub Pages

Add this to `vite.config.ts` if deploying to `https://username.github.io/gtm-workflow/`:

```ts
export default defineConfig({
  base: '/gtm-workflow/',
  plugins: [react(), tailwindcss()],
})
```

Then use a GitHub Actions workflow or deploy manually:

```bash
npm run build
npx gh-pages -d dist
```

## Publish to GitHub

```bash
# Initialize git repo
git init
git add .
git commit -m "Initial commit: GTM Workflow Sandbox"

# Create repo on GitHub (using GitHub CLI)
gh repo create gtm-workflow --public --source=. --push

# Or manually: create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/gtm-workflow.git
git branch -M main
git push -u origin main
```

## Project Structure

```
src/
  components/     Canvas, Sidebar, Toolbar, TemplateModal, ProjectManager
  nodes/          BaseNode + 7 custom node types
  edges/          Custom animated DataFlowEdge
  store/          Zustand store with React Flow integration
  data/           Tag registry (brand colors/icons) + template configs
  utils/          localStorage persistence + ID generation
```

## License

MIT
