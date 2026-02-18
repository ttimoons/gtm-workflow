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
    url: str, name: str, vendor: str, via_gtm: bool, script_type: str
) -> dict:
    return {
        "url": url,
        "name": name,
        "vendor": vendor,
        "via_gtm": via_gtm,
        "type": script_type,
    }


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
    for content in contents:
        content = content.strip()
        if not content:
            continue
        vendor = infer_vendor_from_inline(content)
        records.append(build_script_record("inline", "inline", vendor, False, "inline"))
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

        # GTM Container IDs
        gtm_match = re.search(r'GTM-[A-Z0-9]{6,8}', url)
        if gtm_match and gtm_match.group() not in ids["gtm_containers"]:
            ids["gtm_containers"].append(gtm_match.group())

        # GA4 Properties
        ga4_match = re.search(r'(G-[A-Z0-9]{10}|GT-[A-Z0-9]{7,10})', url)
        if ga4_match and ga4_match.group() not in ids["ga4_properties"]:
            ids["ga4_properties"].append(ga4_match.group())

        # Google Ads
        ads_match = re.search(r'AW-\d{9,11}', url)
        if ads_match and ads_match.group() not in ids["google_ads"]:
            ids["google_ads"].append(ads_match.group())

        # Hotjar
        if "Hotjar" in vendor:
            hj_match = re.search(r'hotjar[-.](com|net)/c/hotjar-(\d+)', url)
            if hj_match and hj_match.group(2) not in ids["hotjar_ids"]:
                ids["hotjar_ids"].append(hj_match.group(2))

        # Microsoft Clarity
        if "Clarity" in vendor:
            clarity_match = re.search(r'clarity\.ms/tag/([a-z0-9]+)', url)
            if clarity_match and clarity_match.group(1) not in ids["clarity_ids"]:
                ids["clarity_ids"].append(clarity_match.group(1))

        # Meta Pixel (from inline scripts)
        if script["type"] == "inline" and "Facebook Pixel" in vendor:
            fb_match = re.search(r'fbq\s*\(\s*[\'"]init[\'"]\s*,\s*[\'"]\s*(\d+)', script["url"])
            if fb_match and fb_match.group(1) not in ids["meta_pixels"]:
                ids["meta_pixels"].append(fb_match.group(1))

        # Amplitude (from URL or inline)
        if "Amplitude" in vendor:
            amp_match = re.search(r'amplitude\.com.*[?&]apiKey=([a-zA-Z0-9]+)', url)
            if amp_match and amp_match.group(1) not in ids["amplitude_keys"]:
                ids["amplitude_keys"].append(amp_match.group(1))
            elif script["type"] == "inline":
                amp_inline = re.search(r'amplitude\.getInstance.*[\'"]([a-zA-Z0-9]+)[\'"]', url)
                if amp_inline and amp_inline.group(1) not in ids["amplitude_keys"]:
                    ids["amplitude_keys"].append(amp_inline.group(1))

        # PostHog (from URL or inline)
        if "PostHog" in vendor:
            ph_match = re.search(r'posthog\.init\s*\(\s*[\'"]([a-zA-Z0-9_-]+)[\'"]', url)
            if ph_match and ph_match.group(1) not in ids["posthog_keys"]:
                ids["posthog_keys"].append(ph_match.group(1))

        # Mixpanel (from URL or inline)
        if "Mixpanel" in vendor:
            mp_match = re.search(r'mixpanel\.init\s*\(\s*[\'"]([a-zA-Z0-9]+)[\'"]', url)
            if mp_match and mp_match.group(1) not in ids["mixpanel_tokens"]:
                ids["mixpanel_tokens"].append(mp_match.group(1))

        # RudderStack (from inline)
        if "RudderStack" in vendor and script["type"] == "inline":
            rs_match = re.search(r'rudderanalytics\.load\s*\(\s*[\'"]([a-zA-Z0-9:]+)[\'"]', url)
            if rs_match and rs_match.group(1) not in ids["rudderstack_keys"]:
                ids["rudderstack_keys"].append(rs_match.group(1))

        # Segment (from inline)
        if "Segment" in vendor and script["type"] == "inline":
            seg_match = re.search(r'analytics\.load\s*\(\s*[\'"]([a-zA-Z0-9]+)[\'"]', url)
            if seg_match and seg_match.group(1) not in ids["segment_keys"]:
                ids["segment_keys"].append(seg_match.group(1))

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

    log(f"Scan complete! Found {len(deduped)} total scripts")

    return {
        "url": url,
        "scanned_at": _now_iso(),
        "gtm_detected": gtm_detected,
        "error": None,
        "scripts": deduped,
        "tracking_ids": tracking_ids,
    }


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
