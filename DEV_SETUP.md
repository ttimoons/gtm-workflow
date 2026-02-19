# Development Setup - GTM Workflow

## Project Location
This project is now located at: `/Users/ttimoon/Dev/gtm-workflow`

## Quick Start

### Start Development Servers
```bash
cd /Users/ttimoon/Dev/gtm-workflow
./start-dev.sh
```

This will start:
- **Backend** on `http://localhost:5001` (Flask + Playwright)
- **Frontend** on `http://localhost:5173` (Vite + React)

### Manual Start

#### Frontend Only
```bash
cd /Users/ttimoon/Dev/gtm-workflow
npm run dev
```

#### Backend Only
```bash
cd /Users/ttimoon/Dev/gtm-workflow/backend
python3 app.py
```

### Build for Production
```bash
cd /Users/ttimoon/Dev/gtm-workflow
npm run build
```

## Project Structure
```
gtm-workflow/
├── src/                  # Frontend React source
│   ├── components/       # React components
│   ├── store/           # Zustand state management
│   ├── utils/           # Utility functions
│   └── data/            # Tag registry & templates
├── backend/             # Python Flask backend
│   ├── app.py          # Main server
│   ├── audit_scripts.py # Domain scanner logic
│   └── vendor_map.py   # Analytics platform detection
├── dist/               # Production build output
└── public/             # Static assets

```

## Key Features
- ✅ 5 New Analytics Platforms: Amplitude, PostHog, Mixpanel, RudderStack, Segment
- ✅ Domain Scanner (requires backend)
- ✅ Conditional Scanner Button (auto-hides when backend unavailable)
- ✅ Template System
- ✅ Project Management
- ✅ Export/Import JSON

## Environment
- **Node**: v24.13.1 (via nvm)
- **npm**: 11.8.0
- **Python**: 3.9.6
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Flask + Playwright

## Deployment
- **GitHub**: https://github.com/palbertus/gtm-workflow.git
- **Netlify**: Auto-deploys from main branch (frontend only)
- **Backend**: Requires separate deployment (not on Netlify)

## Notes
- Scanner button automatically hides on Netlify (frontend-only deployment)
- Backend health check runs on app mount with 3s timeout
- All changes are committed with co-authorship to Claude Sonnet 4.5
