import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { useFlowStore } from '../store/useFlowStore';
import type { TagType } from '../store/types';
import type { AuditResult, ScriptRecord, ScanStage, SSEEvent } from '../types/scanner';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:7182';

// Vendor name → tag node type. Vendors not listed here are skipped on import
// (CDNs, generic libs, etc. don't map to meaningful canvas nodes).
const VENDOR_TAG_MAP: Record<string, { nodeType: 'tag' | 'gtmClient' | 'cmp'; tagType?: TagType; label: string }> = {
  'Google Tag Manager':       { nodeType: 'gtmClient', label: 'GTM Container' },
  'Google Analytics 4 (gtag)':{ nodeType: 'tag', tagType: 'google-tag', label: 'Google Tag' },
  'Google Analytics (UA)':    { nodeType: 'tag', tagType: 'ga4', label: 'GA (Universal)' },
  'Google Analytics (Legacy)':{ nodeType: 'tag', tagType: 'ga4', label: 'GA (Legacy)' },
  'Google Ads':               { nodeType: 'tag', tagType: 'google-ads', label: 'Google Ads' },
  'Google Ads (DoubleClick)': { nodeType: 'tag', tagType: 'floodlight', label: 'DoubleClick / Floodlight' },
  'Facebook Pixel':           { nodeType: 'tag', tagType: 'meta-pixel', label: 'Meta Pixel' },
  'Facebook / Meta SDK':      { nodeType: 'tag', tagType: 'meta-pixel', label: 'Meta SDK' },
  'Hotjar':                   { nodeType: 'tag', tagType: 'hotjar', label: 'Hotjar' },
  'Microsoft Clarity':        { nodeType: 'tag', tagType: 'clarity', label: 'Microsoft Clarity' },
  'Segment':                  { nodeType: 'tag', tagType: 'segment', label: 'Segment' },
  'PostHog':                  { nodeType: 'tag', tagType: 'posthog', label: 'PostHog' },
  'RudderStack':              { nodeType: 'tag', tagType: 'rudderstack', label: 'RudderStack' },
  'Amplitude':                { nodeType: 'tag', tagType: 'amplitude', label: 'Amplitude' },
  'Mixpanel':                 { nodeType: 'tag', tagType: 'mixpanel', label: 'Mixpanel' },
  'TikTok Pixel':             { nodeType: 'tag', tagType: 'tiktok', label: 'TikTok Pixel' },
  'LinkedIn Insight Tag':     { nodeType: 'tag', tagType: 'linkedin', label: 'LinkedIn Insight' },
  'LinkedIn':                 { nodeType: 'tag', tagType: 'linkedin', label: 'LinkedIn' },
  'Twitter/X Ads Pixel':      { nodeType: 'tag', tagType: 'twitter', label: 'X (Twitter) Pixel' },
  'Twitter/X Platform':       { nodeType: 'tag', tagType: 'twitter', label: 'X (Twitter)' },
  'Pinterest Tag':            { nodeType: 'tag', tagType: 'pinterest', label: 'Pinterest Tag' },
  'OneTrust (CMP)':           { nodeType: 'tag', tagType: 'cmp', label: 'OneTrust (CMP)' },
  'Cookiebot (CMP)':          { nodeType: 'tag', tagType: 'cmp', label: 'Cookiebot (CMP)' },
  'Didomi (CMP)':             { nodeType: 'tag', tagType: 'cmp', label: 'Didomi (CMP)' },
  'HubSpot':                  { nodeType: 'tag', tagType: 'custom-html', label: 'HubSpot' },
  'Intercom':                 { nodeType: 'tag', tagType: 'custom-html', label: 'Intercom' },
  'Heap':                     { nodeType: 'tag', tagType: 'custom-html', label: 'Heap' },
  'FullStory':                { nodeType: 'tag', tagType: 'custom-html', label: 'FullStory' },
  'Pendo':                    { nodeType: 'tag', tagType: 'custom-html', label: 'Pendo' },
  'Drift':                    { nodeType: 'tag', tagType: 'custom-html', label: 'Drift' },
  'Crazy Egg':                { nodeType: 'tag', tagType: 'custom-html', label: 'Crazy Egg' },
  'Lucky Orange':             { nodeType: 'tag', tagType: 'custom-html', label: 'Lucky Orange' },
  'Sentry':                   { nodeType: 'tag', tagType: 'data-tag', label: 'Sentry' },
  'Datadog':                  { nodeType: 'tag', tagType: 'data-tag', label: 'Datadog' },
  'New Relic':                { nodeType: 'tag', tagType: 'data-tag', label: 'New Relic' },
  'Stripe':                   { nodeType: 'tag', tagType: 'data-tag', label: 'Stripe' },
  'Crisp':                    { nodeType: 'tag', tagType: 'custom-html', label: 'Crisp' },
  'Zendesk':                  { nodeType: 'tag', tagType: 'custom-html', label: 'Zendesk' },
  'Google Optimize':          { nodeType: 'tag', tagType: 'custom-html', label: 'Google Optimize' },
  'Google AdSense':           { nodeType: 'tag', tagType: 'custom-html', label: 'Google AdSense' },
  'Google Publisher Tags':    { nodeType: 'tag', tagType: 'custom-html', label: 'Google Publisher Tags' },
  'Google Ad Traffic Quality': { nodeType: 'tag', tagType: 'custom-html', label: 'Google Ad Quality' },
  'CookieLaw (CMP)':         { nodeType: 'tag', tagType: 'cmp', label: 'CookieLaw (CMP)' },
  'Cookie Consent (CMP)':    { nodeType: 'tag', tagType: 'cmp', label: 'Cookie Consent (CMP)' },
  'CMP Framework':           { nodeType: 'tag', tagType: 'cmp', label: 'CMP Framework' },
  'TCF Consent (CMP)':       { nodeType: 'tag', tagType: 'cmp', label: 'TCF Consent (CMP)' },
  'Cloudflare Web Analytics': { nodeType: 'tag', tagType: 'data-tag', label: 'Cloudflare Analytics' },
  'Cloudflare Turnstile':    { nodeType: 'tag', tagType: 'custom-html', label: 'Cloudflare Turnstile' },
  'TrustIndex':              { nodeType: 'tag', tagType: 'custom-html', label: 'TrustIndex' },
  'Trustpilot':              { nodeType: 'tag', tagType: 'custom-html', label: 'Trustpilot' },
  'Matomo':                  { nodeType: 'tag', tagType: 'custom-html', label: 'Matomo' },
  'Plausible Analytics':     { nodeType: 'tag', tagType: 'custom-html', label: 'Plausible Analytics' },
  'Google Maps':             { nodeType: 'tag', tagType: 'custom-html', label: 'Google Maps' },
};

type VendorGroup = {
  vendor: string;
  scripts: ScriptRecord[];
  importable: boolean;
  mapping: (typeof VENDOR_TAG_MAP)[string] | null;
};

function groupScriptsByVendor(scripts: ScriptRecord[]): VendorGroup[] {
  const map = new Map<string, ScriptRecord[]>();
  for (const s of scripts) {
    const list = map.get(s.vendor) || [];
    list.push(s);
    map.set(s.vendor, list);
  }

  const groups: VendorGroup[] = [];
  for (const [vendor, vendorScripts] of map) {
    const mapping = VENDOR_TAG_MAP[vendor] ?? null;
    groups.push({ vendor, scripts: vendorScripts, importable: mapping !== null, mapping });
  }

  // Importable vendors first, then alphabetical
  groups.sort((a, b) => {
    if (a.importable !== b.importable) return a.importable ? -1 : 1;
    return a.vendor.localeCompare(b.vendor);
  });

  return groups;
}

const CATEGORY_COLORS: Record<string, string> = {
  gtmClient: 'bg-blue-100 text-blue-800',
  tag: 'bg-indigo-100 text-indigo-800',
  cmp: 'bg-emerald-100 text-emerald-800',
};

interface DomainScannerModalProps {
  onClose: () => void;
}

export function DomainScannerModal({ onClose }: DomainScannerModalProps) {
  const [stage, setStage] = useState<ScanStage>('input');
  const [url, setUrl] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addNode = useFlowStore((s) => s.addNode);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const vendorGroups = useMemo(() => {
    if (!result) return [];
    return groupScriptsByVendor(result.scripts);
  }, [result]);

  const importableGroups = useMemo(
    () => vendorGroups.filter((g) => g.importable),
    [vendorGroups],
  );

  // Auto-select all importable vendors when results arrive
  useEffect(() => {
    if (importableGroups.length > 0) {
      setSelectedVendors(new Set(importableGroups.map((g) => g.vendor)));
    }
  }, [importableGroups]);

  const toggleVendor = (vendor: string) => {
    setSelectedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vendor)) next.delete(vendor);
      else next.add(vendor);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedVendors.size === importableGroups.length) {
      setSelectedVendors(new Set());
    } else {
      setSelectedVendors(new Set(importableGroups.map((g) => g.vendor)));
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const startScan = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLogs([]);
    setError('');
    setResult(null);
    setSelectedVendors(new Set());
    setStage('scanning');
    addLog(`Starting scan for: ${url}`);

    try {
      const startResponse = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, timeout: 30 }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start audit');
      }

      const { job_id } = await startResponse.json();
      addLog(`Job started: ${job_id}`);

      const eventSource = new EventSource(`${API_BASE_URL}/api/stream/${job_id}`);

      eventSource.onmessage = (event) => {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'status':
          case 'log':
            if (data.message) addLog(data.message);
            break;

          case 'result':
            if (data.data) {
              addLog('✓ Scan completed successfully!');
              setResult(data.data);
              setStage('results');
            }
            eventSource.close();
            break;

          case 'error':
            addLog(`✗ Error: ${data.message || 'Unknown error'}`);
            setError(data.message || 'An error occurred during scanning');
            setStage('error');
            eventSource.close();
            break;

          case 'done':
            eventSource.close();
            break;
        }
      };

      eventSource.onerror = () => {
        addLog('✗ Connection lost');
        setError('Connection to server lost');
        setStage('error');
        eventSource.close();
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend';
      addLog(`✗ ${message}`);
      setError(message);
      setStage('error');
    }
  };

  const handleImportTags = () => {
    if (!result) return;

    let nodeIndex = 0;
    const startX = 300;
    const startY = 200;
    const gridSpacing = 280;
    const columns = 3;

    const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Deduplicate: one node per unique vendor (not per script)
    for (const group of importableGroups) {
      if (!selectedVendors.has(group.vendor)) continue;
      const mapping = group.mapping!;

      const col = nodeIndex % columns;
      const row = Math.floor(nodeIndex / columns);

      const nodeBase = {
        id: generateId(),
        position: { x: startX + col * gridSpacing, y: startY + row * gridSpacing },
      };

      if (mapping.nodeType === 'gtmClient') {
        addNode({
          ...nodeBase,
          type: 'gtmClient',
          data: {
            label: mapping.label,
            containerType: 'client',
          },
        });
      } else {
        addNode({
          ...nodeBase,
          type: 'tag',
          data: {
            label: mapping.label,
            tagType: mapping.tagType!,
          },
        });
      }

      nodeIndex++;
    }

    if (nodeIndex > 0) {
      addLog(`✓ Imported ${nodeIndex} tags to canvas`);
    }
    onClose();
  };

  const selectedCount = selectedVendors.size;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Scan Website for Tags</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Input Stage */}
          {stage === 'input' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startScan()}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Launches headless Chromium browser</li>
                  <li>Detects all scripts including GTM-injected tags</li>
                  <li>Identifies vendors (GTM, GA4, Meta Pixel, etc.)</li>
                  <li>Select which tags to import as nodes on canvas</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Scanning Stage */}
          {stage === 'scanning' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 size={48} className="text-blue-500 animate-spin" />
              </div>
              <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-xs max-h-80 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* Results Stage */}
          {stage === 'results' && result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Scan completed successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Found {result.scripts.length} scripts from {vendorGroups.length} vendors
                    {result.gtm_detected && ' — GTM detected'}
                  </p>
                </div>
              </div>

              {/* Importable tags with checkboxes */}
              {importableGroups.length > 0 && (
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Detected Tags ({importableGroups.length})
                    </h3>
                    <button
                      onClick={toggleAll}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedVendors.size === importableGroups.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {importableGroups.map((group) => {
                      const selected = selectedVendors.has(group.vendor);
                      const colorClass = CATEGORY_COLORS[group.mapping!.nodeType] || 'bg-gray-100 text-gray-800';
                      return (
                        <label
                          key={group.vendor}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                            selected ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              selected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {selected && <Check size={12} className="text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selected}
                            onChange={() => toggleVendor(group.vendor)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900">
                              {group.mapping!.label}
                            </span>
                            {group.vendor !== group.mapping!.label && (
                              <span className="text-xs text-gray-500 ml-1.5">
                                ({group.vendor})
                              </span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                            {group.scripts.length} {group.scripts.length === 1 ? 'script' : 'scripts'}
                          </span>
                          {group.scripts.some((s) => s.via_gtm) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                              via GTM
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Non-importable scripts (CDNs, unknown, etc.) */}
              {vendorGroups.some((g) => !g.importable) && (
                <details className="bg-gray-50 rounded-md">
                  <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Other Scripts ({vendorGroups.filter((g) => !g.importable).reduce((n, g) => n + g.scripts.length, 0)})
                  </summary>
                  <div className="px-4 pb-3 space-y-1">
                    {vendorGroups
                      .filter((g) => !g.importable)
                      .map((group) => (
                        <div key={group.vendor} className="flex items-center justify-between text-sm py-1">
                          <span className="text-gray-600">{group.vendor}</span>
                          <span className="text-xs text-gray-400">
                            {group.scripts.length} {group.scripts.length === 1 ? 'script' : 'scripts'}
                          </span>
                        </div>
                      ))}
                  </div>
                </details>
              )}

              {/* Logs */}
              <details className="bg-gray-50 rounded-md">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100">
                  View Scan Logs
                </summary>
                <div className="bg-gray-900 text-gray-100 rounded-b-md p-4 font-mono text-xs max-h-60 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Error Stage */}
          {stage === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Scan failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              {logs.length > 0 && (
                <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-xs max-h-80 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {stage === 'input' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startScan}
                disabled={!url.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Start Scan
              </button>
            </>
          )}

          {stage === 'scanning' && (
            <div className="text-sm text-gray-600">Scanning in progress...</div>
          )}

          {stage === 'results' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportTags}
                disabled={selectedCount === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Import {selectedCount} {selectedCount === 1 ? 'Tag' : 'Tags'} to Canvas
              </button>
            </>
          )}

          {stage === 'error' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setStage('input')}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
