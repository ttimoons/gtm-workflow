#!/usr/bin/env python3
"""
app.py — Flask API server for GTM Workflow script auditor integration.
Run with: python3 app.py
"""

import json
import queue
import threading
import uuid

from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from playwright.sync_api import sync_playwright

from audit_scripts import audit_url

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# job_id -> queue.Queue of SSE event dicts
_jobs: dict[str, queue.Queue] = {}
_jobs_lock = threading.Lock()


def _send(q: queue.Queue, event_type: str, **kwargs):
    q.put({"type": event_type, **kwargs})


# ---------------------------------------------------------------------------
# Background audit worker
# ---------------------------------------------------------------------------

def run_audit_job(job_id: str, url: str, timeout_ms: int):
    q = _jobs[job_id]

    def log(message: str):
        _send(q, "log", message=message)

    try:
        _send(q, "status", message="Launching browser...")
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            try:
                _send(q, "status", message=f"Connecting to {url}...")
                result = audit_url(url, browser, timeout_ms, log_callback=log)
            finally:
                browser.close()

        if result.get("error"):
            _send(q, "error", message=result["error"])
        else:
            _send(q, "status", message="Processing results...")
            _send(q, "result", data=result)
    except Exception as e:
        _send(q, "error", message=str(e))
    finally:
        _send(q, "done")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/audit", methods=["POST"])
def start_audit():
    body = request.get_json(silent=True) or {}
    url = (body.get("url") or "").strip()

    if not url:
        return jsonify({"error": "URL is required"}), 400
    if not url.startswith(("http://", "https://")):
        return jsonify({"error": "URL must start with http:// or https://"}), 400

    timeout_sec = int(body.get("timeout", 30))
    timeout_ms = max(5, min(timeout_sec, 120)) * 1000

    job_id = str(uuid.uuid4())
    q: queue.Queue = queue.Queue()
    with _jobs_lock:
        _jobs[job_id] = q

    t = threading.Thread(
        target=run_audit_job,
        args=(job_id, url, timeout_ms),
        daemon=True
    )
    t.start()

    return jsonify({"job_id": job_id})


@app.route("/api/stream/<job_id>")
def stream(job_id: str):
    with _jobs_lock:
        q = _jobs.get(job_id)
    if q is None:
        return Response("Job not found", status=404)

    def generate():
        while True:
            try:
                event = q.get(timeout=120)
            except queue.Empty:
                yield 'data: {"type": "error", "message": "Timeout waiting for results"}\n\n'
                break

            payload = json.dumps(event)
            yield f"data: {payload}\n\n"

            if event["type"] in ("done", "error"):
                # Clean up job
                with _jobs_lock:
                    _jobs.pop(job_id, None)
                break

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 7182))
    print(f"Starting GTM Workflow API server at http://127.0.0.1:{port}")
    print("CORS enabled for frontend integration")
    app.run(debug=False, threaded=True, port=port, host="127.0.0.1")
