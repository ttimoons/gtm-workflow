# Domain Scanner Integration Guide

## Overview

This feature integrates a Python/Playwright-based script auditor with the GTM Workflow React app. It allows users to scan any website and automatically detect all tracking tags (including GTM-injected tags), then import them as nodes on the canvas.

## Architecture

```
┌─────────────────┐         HTTP API          ┌─────────────────┐
│   React App     │  ←──────────────────────→  │   Flask API     │
│  (Port 5173)    │         (CORS)             │  (Port 5001)    │
└─────────────────┘                            └─────────────────┘
                                                        │
                                                        ↓
                                                ┌───────────────┐
                                                │  Playwright   │
                                                │   Chromium    │
                                                └───────────────┘
```

### Frontend (React)
- **Location**: `src/components/DomainScannerModal.tsx`
- **Purpose**: UI for scanning websites and displaying results
- **Features**:
  - URL input with validation
  - Real-time log display via Server-Sent Events (SSE)
  - Results summary with tracking ID counts
  - One-click import to canvas

### Backend (Python Flask)
- **Location**: `backend/app.py`
- **Purpose**: Script auditing API server
- **Features**:
  - `/api/audit` - Start audit job (POST)
  - `/api/stream/{job_id}` - SSE stream for progress (GET)
  - `/health` - Health check (GET)

### Auditor Engine
- **Location**: `backend/audit_scripts.py`
- **Purpose**: Core scanning logic using Playwright
- **Features**:
  - Launches headless Chromium
  - Waits for network idle + 2 seconds for GTM tags
  - Intercepts network requests
  - Detects dynamically-injected scripts
  - Extracts tracking IDs (GTM, GA4, Meta Pixel, etc.)

### Vendor Detection
- **Location**: `backend/vendor_map.py`
- **Purpose**: Pattern matching for 50+ vendors
- **Vendors Supported**:
  - Google: GTM, GA4, Google Ads, Optimize
  - Meta: Facebook Pixel
  - Analytics: Hotjar, Mixpanel, Amplitude, Heap, Segment
  - Marketing: LinkedIn, Twitter/X, TikTok, Pinterest
  - Support: Intercom, Drift, Zendesk, Crisp
  - Error Tracking: Sentry, Datadog, New Relic
  - CMP: OneTrust, Cookiebot, Didomi
  - And more...

## Installation

### 1. Install Python Dependencies

```bash
cd backend
pip3 install -r requirements.txt
python3 -m playwright install chromium
```

### 2. Install Node Dependencies (if not already done)

```bash
npm install
```

## Running the App

### Option A: Using the Startup Script (Recommended)

```bash
./start-dev.sh
```

This will start both servers:
- Backend: http://127.0.0.1:5001
- Frontend: http://localhost:5173

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python3 app.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Using the Scanner

1. Open the app at http://localhost:5173
2. Click the **"Scan Domain"** button in the toolbar (globe icon)
3. Enter a website URL (e.g., `https://example.com`)
4. Click **"Start Scan"**
5. Watch the real-time logs as the scan progresses
6. Review the detected tags in the results summary
7. Click **"Import Tags to Canvas"** to add them as nodes

## What Gets Imported

The scanner extracts tracking IDs and creates corresponding nodes:

| Detected Tag | Node Type | Node Data |
|--------------|-----------|-----------|
| GTM Container (`GTM-XXXX`) | `gtmClient` | Container ID |
| GA4 Property (`G-XXXX` or `GT-XXXX`) | `tag` with `tagType: 'ga4'` | Property ID |
| Meta Pixel | `tag` with `tagType: 'meta-pixel'` | Pixel ID |
| Google Ads (`AW-XXXX`) | `tag` with `tagType: 'google-ads'` | Conversion ID |
| Hotjar | `tag` with `tagType: 'custom'` | Site ID |
| Microsoft Clarity | `tag` with `tagType: 'custom'` | Project ID |

Nodes are positioned in a 3-column grid starting at (300, 200) with 280px spacing.

## How It Works

### 1. User Initiates Scan
- User enters URL in modal
- Frontend sends POST request to `/api/audit`
- Backend returns `job_id`

### 2. Backend Processing
- Creates background thread for audit job
- Launches Playwright Chromium browser
- Intercepts all script requests via `page.on('request')`
- Navigates to URL with `wait_until="networkidle"`
- Waits additional 2 seconds for late-firing GTM tags
- Takes snapshot of DOM scripts
- Compares network-captured scripts vs DOM scripts
- Scripts in network but not in DOM = dynamically injected (via GTM)

### 3. Real-Time Updates
- Frontend connects to `/api/stream/{job_id}` (SSE)
- Backend sends events:
  - `status` - Major milestones (e.g., "Launching browser...")
  - `log` - Detailed progress (e.g., "✓ Google Tag Manager detected")
  - `result` - Final audit results with scripts and tracking IDs
  - `error` - Error messages
  - `done` - Job complete

### 4. Results Display
- Frontend receives `result` event
- Displays summary with tag counts
- Shows full logs in collapsible section
- User clicks "Import Tags to Canvas"

### 5. Node Creation
- Frontend extracts tracking IDs from result
- Creates node for each ID using `useFlowStore.addNode()`
- Positions nodes in grid layout
- Closes modal

## File Structure

```
gtm-workflow/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── audit_scripts.py       # Playwright scanning engine
│   ├── vendor_map.py          # Vendor pattern matching
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Backend API docs
├── src/
│   ├── components/
│   │   ├── DomainScannerModal.tsx  # Scanner UI
│   │   └── Toolbar.tsx             # Scan button integration
│   └── types/
│       └── scanner.ts              # TypeScript types
├── start-dev.sh               # Startup script
└── SCANNER_INTEGRATION.md     # This file
```

## Troubleshooting

### Backend Not Starting
- Ensure Python 3.9+ is installed: `python3 --version`
- Check dependencies: `pip3 list | grep -E "flask|playwright"`
- Verify Chromium: `python3 -m playwright install chromium`

### CORS Errors
- Ensure Flask-CORS is installed: `pip3 install flask-cors`
- Backend must be on port 5001 (hardcoded in `DomainScannerModal.tsx`)
- Frontend must be on a different port (default 5173)

### Scan Timeouts
- Default timeout is 30 seconds
- Some websites block automation (CAPTCHA, bot detection)
- Try scanning a simpler page first (e.g., Google homepage)

### No Tags Detected
- Some websites use different tag implementations
- Check the logs for any errors during scanning
- Verify the website has tracking tags by inspecting source code

### Frontend Can't Connect to Backend
- Verify backend is running: `curl http://127.0.0.1:5001/health`
- Check browser console for CORS errors
- Ensure both servers are running

## Extending the Feature

### Adding New Vendor Patterns

Edit `backend/vendor_map.py`:

```python
VENDOR_PATTERNS = [
    # Add your pattern here (more specific patterns first)
    ("your-domain.com/script.js", "Your Vendor Name"),
    # ... existing patterns
]
```

### Adding New Tracking ID Extraction

Edit `backend/audit_scripts.py` in the `extract_tracking_ids()` function:

```python
# Your custom extraction logic
your_match = re.search(r'YOUR_PATTERN', url)
if your_match and your_match.group() not in ids["your_ids"]:
    ids["your_ids"].append(your_match.group())
```

Then update `DomainScannerModal.tsx` in `handleImportTags()`:

```typescript
// Import your custom tags
tracking_ids.your_ids.forEach((id) => {
  addNode(
    createNode({
      type: 'tag',
      data: {
        label: 'Your Tag',
        tagType: 'custom',
        trackingId: id,
      },
    })
  );
});
```

### Changing Backend Port

1. Edit `backend/app.py`:
```python
app.run(debug=False, threaded=True, port=YOUR_PORT, host="127.0.0.1")
```

2. Edit `src/components/DomainScannerModal.tsx`:
```typescript
const API_BASE_URL = 'http://127.0.0.1:YOUR_PORT';
```

## Performance Notes

- Each scan launches a fresh Chromium instance
- Typical scan time: 5-10 seconds
- Memory usage: ~200-300MB per scan
- Backend is single-threaded (Flask development server)
- For production, use Gunicorn (see `script-auditor` repo for example)

## Security Considerations

- Backend runs on localhost only (127.0.0.1)
- No authentication required (intended for local development)
- Do not expose backend to public internet
- Scanned websites can execute JavaScript in headless browser
- Playwright runs with `--no-sandbox` flag (required on some systems)

## Credits

This integration is inspired by and uses code from:
- [script-auditor](https://github.com/palbertus/script-auditor) by palbertus

## License

Same as parent project.
