# GTM Workflow Backend API

Python Flask API server for script auditing functionality using Playwright.

## Setup

1. Install dependencies:
```bash
pip3 install -r requirements.txt
python3 -m playwright install chromium
```

2. Start the server:
```bash
python3 app.py
```

The server will run on `http://127.0.0.1:5001`

## API Endpoints

### POST /api/audit
Start a new audit job.

**Request:**
```json
{
  "url": "https://example.com",
  "timeout": 30
}
```

**Response:**
```json
{
  "job_id": "uuid-string"
}
```

### GET /api/stream/{job_id}
Server-Sent Events stream for audit progress and results.

**Events:**
- `status`: Progress updates
- `log`: Real-time log messages
- `result`: Final audit results with scripts and tracking IDs
- `error`: Error messages
- `done`: Audit complete

### GET /health
Health check endpoint.

## Features

- Detects all scripts including GTM-injected ones
- Extracts tracking IDs (GTM, GA4, Meta Pixel, etc.)
- Real-time logging via SSE
- CORS enabled for frontend integration
