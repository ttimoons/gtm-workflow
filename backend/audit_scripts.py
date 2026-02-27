#!/usr/bin/env python3
"""
audit_scripts.py — Detect all JavaScript scripts loaded on a webpage,
including those injected by Google Tag Manager.
"""

import re
from datetime import datetime, timezone
from urllib.parse import urlparse
from playwright.sync_api import Browser, Page
from vendor_map import infer_vendor_from_inline, lookup_vendor

# URLs to ignore (GTM internal / debug endpoints)
_FILTERED_URL_FRAGMENTS = [
    "googletagmanager.com/gtm/init",
    "googletagmanager.com/gtm/preview",
    "googletagmanager.com/debug",
]


def infer_name(url: str) -> str:
    """Extract a human-readable script name from a URL."""
    if url == "inline":
        return "inline"
    try:
        path = urlparse(url).path.rstrip("/")
        filename = path.split("/")[-1] if "/" in path else path
        # Strip query params that crept into the filename
        filename = filename.split("?")[0]
        if filename:
            return filename
        # Fallback: use hostname
        return urlparse(url).hostname or url
    except Exception:
        return url


def is_gtm_request(url: str) -> bool:
    """Return True if this URL is the GTM container loader."""
    lower = url.lower()
    return (
        "googletagmanager.com/gtm.js" in lower
        or "googletagmanager.com/gtag/js" in lower
    )


def is_filtered_url(url: str) -> bool:
    """Return True if this URL should be ignored (GTM internal endpoints)."""
    lower = url.lower()
    return any(fragment in lower for fragment in _FILTERED_URL_FRAGMENTS)


def build_script_record(
    url: str, name: str, vendor: str, via_gtm: bool, script_type: str,
    content: str = "",
) -> dict:
    record: dict = {
        "url": url,
        "name": name,
        "vendor": vendor,
        "via_gtm": via_gtm,
        "type": script_type,
    }
    if content:
        record["content"] = content
    return record


def extract_inline_scripts(page: Page) -> list:
    """Return records for all non-empty inline <script> tags."""
    try:
        contents = page.eval_on_selector_all(
            "script:not([src])",
            "els => els.map(el => el.textContent || '')"
        )
    except Exception:
        return []

    records = []
    for idx, content in enumerate(contents):
        content = content.strip()
        if not content:
            continue
        vendor = infer_vendor_from_inline(content)
        records.append(build_script_record(
            f"inline#{idx}", "inline", vendor, False, "inline",
            content=content,
        ))
    return records


def get_dom_script_urls(page: Page) -> set:
    """Return the set of absolute src URLs from <script src> elements in the DOM."""
    try:
        urls = page.eval_on_selector_all(
            "script[src]",
            "els => els.map(el => el.src)"
        )
        return set(u for u in urls if u)
    except Exception:
        return set()


def _add_unique(lst: list, value: str):
    if value not in lst:
        lst.append(value)


def extract_tracking_ids(scripts: list) -> dict:
    """Extract tracking IDs from script records for easy node creation."""
    ids = {
        "gtm_containers": [],
        "ga4_properties": [],
        "meta_pixels": [],
        "google_ads": [],
        "tiktok_pixels": [],
        "linkedin_tags": [],
        "twitter_pixels": [],
        "hotjar_ids": [],
        "clarity_ids": [],
        "amplitude_keys": [],
        "posthog_keys": [],
        "mixpanel_tokens": [],
        "rudderstack_keys": [],
        "segment_keys": [],
    }

    for script in scripts:
        url = script["url"]
        vendor = script["vendor"]
        # For inline scripts the useful text is in content, not url
        text = script.get("content", "") if script["type"] == "inline" else url

        # GTM Container IDs (from URL or inline content)
        for gtm_match in re.finditer(r'GTM-[A-Z0-9]{4,8}', text):
            _add_unique(ids["gtm_containers"], gtm_match.group())
        for gtm_match in re.finditer(r'GTM-[A-Z0-9]{4,8}', url):
            _add_unique(ids["gtm_containers"], gtm_match.group())

        # GA4 Measurement IDs (G-XXXXXXXXXX only, not GT- which are Samsung models)
        for ga4_match in re.finditer(r'G-[A-Z0-9]{10,12}', text):
            _add_unique(ids["ga4_properties"], ga4_match.group())
        for ga4_match in re.finditer(r'G-[A-Z0-9]{10,12}', url):
            _add_unique(ids["ga4_properties"], ga4_match.group())

        # Google Ads
        for ads_match in re.finditer(r'AW-\d{9,11}', text):
            _add_unique(ids["google_ads"], ads_match.group())

        # Meta Pixel
        if "Facebook" in vendor or "Meta" in vendor:
            for fb_match in re.finditer(r'fbq\s*\(\s*[\'"]init[\'"]\s*,\s*[\'"](\d+)', text):
                _add_unique(ids["meta_pixels"], fb_match.group(1))

        # TikTok
        if "TikTok" in vendor:
            for tt_match in re.finditer(r'ttq\.load\s*\(\s*[\'"]([A-Z0-9]+)', text):
                _add_unique(ids["tiktok_pixels"], tt_match.group(1))

        # LinkedIn
        if "LinkedIn" in vendor:
            for li_match in re.finditer(r'_linkedin_partner_id\s*=\s*[\'"](\d+)', text):
                _add_unique(ids["linkedin_tags"], li_match.group(1))

        # Twitter/X
        if "Twitter" in vendor:
            for tw_match in re.finditer(r'twq\s*\(\s*[\'"]init[\'"]\s*,\s*[\'"]([a-z0-9]+)', text):
                _add_unique(ids["twitter_pixels"], tw_match.group(1))

        # Hotjar
        if "Hotjar" in vendor:
            for hj_match in re.finditer(r'hotjar[-.](com|net)/c/hotjar-(\d+)', url):
                _add_unique(ids["hotjar_ids"], hj_match.group(2))
            for hj_match in re.finditer(r'hj\s*\(\s*[\'"]init[\'"]\s*,\s*(\d+)', text):
                _add_unique(ids["hotjar_ids"], hj_match.group(1))

        # Microsoft Clarity
        if "Clarity" in vendor:
            for cl_match in re.finditer(r'clarity\.ms/tag/([a-z0-9]+)', url):
                _add_unique(ids["clarity_ids"], cl_match.group(1))
            for cl_match in re.finditer(r'clarity\s*\(\s*[\'"]init[\'"]\s*,\s*[\'"]([a-z0-9]+)', text):
                _add_unique(ids["clarity_ids"], cl_match.group(1))

        # Amplitude
        if "Amplitude" in vendor:
            for amp_match in re.finditer(r'apiKey[\'"\s:=]+([a-f0-9]{32})', text):
                _add_unique(ids["amplitude_keys"], amp_match.group(1))

        # PostHog
        if "PostHog" in vendor:
            for ph_match in re.finditer(r'posthog\.init\s*\(\s*[\'"]([a-zA-Z0-9_-]+)', text):
                _add_unique(ids["posthog_keys"], ph_match.group(1))

        # Mixpanel
        if "Mixpanel" in vendor:
            for mp_match in re.finditer(r'mixpanel\.init\s*\(\s*[\'"]([a-f0-9]{32})', text):
                _add_unique(ids["mixpanel_tokens"], mp_match.group(1))

        # RudderStack
        if "RudderStack" in vendor:
            for rs_match in re.finditer(r'rudderanalytics\.load\s*\(\s*[\'"]([a-zA-Z0-9:]+)', text):
                _add_unique(ids["rudderstack_keys"], rs_match.group(1))

        # Segment
        if "Segment" in vendor:
            for seg_match in re.finditer(r'analytics\.load\s*\(\s*[\'"]([a-zA-Z0-9]+)', text):
                _add_unique(ids["segment_keys"], seg_match.group(1))

    return ids


def audit_url(url: str, browser: Browser, timeout_ms: int, log_callback=None) -> dict:
    """Audit a single URL and return a result dict."""
    def log(message: str):
        if log_callback:
            log_callback(message)

    log(f"Creating browser context for {url}")
    context = browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0.0.0 Safari/537.36"
        )
    )
    page = context.new_page()

    captured_requests: list = []
    gtm_detected = False

    def handle_request(request):
        nonlocal gtm_detected
        if request.resource_type == "script":
            req_url = request.url
            if is_filtered_url(req_url):
                return
            captured_requests.append(req_url)
            if is_gtm_request(req_url):
                gtm_detected = True
                log("✓ Google Tag Manager detected")

    page.on("request", handle_request)

    try:
        log(f"Navigating to {url}...")
        page.goto(url, wait_until="networkidle", timeout=timeout_ms)
        log("Page loaded, waiting for network to idle...")
    except Exception as e:
        log(f"Error loading page: {str(e)}")
        context.close()
        return {
            "url": url,
            "scanned_at": _now_iso(),
            "gtm_detected": False,
            "error": str(e),
            "scripts": [],
            "tracking_ids": {},
        }

    # Extra buffer for late-firing GTM tags
    try:
        log("Waiting 2 seconds for late-firing GTM tags...")
        page.wait_for_timeout(2000)
    except Exception:
        pass

    log("Extracting scripts from DOM...")
    # Snapshot DOM scripts (present in initial HTML or injected synchronously)
    dom_script_urls = get_dom_script_urls(page)
    log(f"Found {len(dom_script_urls)} external scripts in DOM")

    # Inline scripts
    inline_records = extract_inline_scripts(page)
    log(f"Found {len(inline_records)} inline scripts")

    # External scripts present in the DOM
    dom_external_records = []
    for script_url in dom_script_urls:
        name = infer_name(script_url)
        vendor = lookup_vendor(script_url)
        dom_external_records.append(
            build_script_record(script_url, name, vendor, False, "external")
        )

    # Dynamic scripts = network-captured but not in the DOM snapshot
    log("Analyzing dynamically-injected scripts...")
    dynamic_records = []
    for script_url in captured_requests:
        if script_url not in dom_script_urls:
            name = infer_name(script_url)
            vendor = lookup_vendor(script_url)
            dynamic_records.append(
                build_script_record(script_url, name, vendor, gtm_detected, "external")
            )

    log(f"Found {len(dynamic_records)} dynamically-injected scripts")

    context.close()

    # Combine and deduplicate by (url, type)
    all_scripts = inline_records + dom_external_records + dynamic_records
    seen = set()
    deduped = []
    for s in all_scripts:
        key = (s["url"], s["type"])
        if key not in seen:
            seen.add(key)
            deduped.append(s)

    log("Extracting tracking IDs from scripts...")
    tracking_ids = extract_tracking_ids(deduped)

    # Strip inline content before sending to frontend (can be very large)
    cleaned = [{k: v for k, v in s.items() if k != "content"} for s in deduped]

    log(f"Scan complete! Found {len(cleaned)} total scripts")

    return {
        "url": url,
        "scanned_at": _now_iso(),
        "gtm_detected": gtm_detected,
        "error": None,
        "scripts": cleaned,
        "tracking_ids": tracking_ids,
    }


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
