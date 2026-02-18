import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useFlowStore } from '../store/useFlowStore';
import type { AuditResult, ScanStage, SSEEvent } from '../types/scanner';

const API_BASE_URL = 'http://127.0.0.1:5001';

interface DomainScannerModalProps {
  onClose: () => void;
}

export function DomainScannerModal({ onClose }: DomainScannerModalProps) {
  const [stage, setStage] = useState<ScanStage>('input');
  const [url, setUrl] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addNode = useFlowStore((s) => s.addNode);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const startScan = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Reset state
    setLogs([]);
    setError('');
    setResult(null);
    setStage('scanning');
    addLog(`Starting scan for: ${url}`);

    try {
      // Start audit job
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

      // Connect to SSE stream
      const eventSource = new EventSource(`${API_BASE_URL}/api/stream/${job_id}`);

      eventSource.onmessage = (event) => {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'status':
            if (data.message) addLog(data.message);
            break;

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

    const { tracking_ids } = result;
    let nodeIndex = 0;
    const startX = 300;
    const startY = 200;
    const gridSpacing = 280;
    const columns = 3;

    const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const createNode = (data: any) => {
      const col = nodeIndex % columns;
      const row = Math.floor(nodeIndex / columns);
      nodeIndex++;

      return {
        id: generateId(),
        position: {
          x: startX + col * gridSpacing,
          y: startY + row * gridSpacing,
        },
        ...data,
      };
    };

    // Import GTM Containers
    tracking_ids.gtm_containers.forEach((containerId) => {
      addNode(
        createNode({
          type: 'gtmClient',
          data: {
            label: `GTM Container`,
            accountId: containerId,
            containerId: containerId,
            containerType: 'client',
          },
        })
      );
    });

    // Import GA4 Properties
    tracking_ids.ga4_properties.forEach((propertyId) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'GA4 Event',
            tagType: 'ga4',
            trackingId: propertyId,
          },
        })
      );
    });

    // Import Meta Pixels
    tracking_ids.meta_pixels.forEach((pixelId) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'Meta Pixel',
            tagType: 'meta-pixel',
            trackingId: pixelId,
          },
        })
      );
    });

    // Import Google Ads
    tracking_ids.google_ads.forEach((conversionId) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'Google Ads',
            tagType: 'google-ads',
            trackingId: conversionId,
          },
        })
      );
    });

    // Import Hotjar
    tracking_ids.hotjar_ids.forEach((siteId) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'Hotjar',
            tagType: 'hotjar',
            trackingId: siteId,
          },
        })
      );
    });

    // Import Microsoft Clarity
    tracking_ids.clarity_ids.forEach((projectId) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'Microsoft Clarity',
            tagType: 'clarity',
            trackingId: projectId,
          },
        })
      );
    });

    // Import Amplitude
    tracking_ids.amplitude_keys.forEach((apiKey) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'Amplitude',
            tagType: 'amplitude',
            trackingId: apiKey,
          },
        })
      );
    });

    // Import PostHog
    tracking_ids.posthog_keys.forEach((projectKey) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'PostHog',
            tagType: 'posthog',
            trackingId: projectKey,
          },
        })
      );
    });

    // Import Mixpanel
    tracking_ids.mixpanel_tokens.forEach((token) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'Mixpanel',
            tagType: 'mixpanel',
            trackingId: token,
          },
        })
      );
    });

    // Import RudderStack
    tracking_ids.rudderstack_keys.forEach((writeKey) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'RudderStack',
            tagType: 'rudderstack',
            trackingId: writeKey,
          },
        })
      );
    });

    // Import Segment
    tracking_ids.segment_keys.forEach((writeKey) => {
      addNode(
        createNode({
          type: 'tag',
          data: {
            label: 'Segment',
            tagType: 'segment',
            trackingId: writeKey,
          },
        })
      );
    });

    addLog(`✓ Imported ${nodeIndex} tags to canvas`);
    onClose();
  };

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
                  <li>Extracts tracking IDs (GTM, GA4, Meta Pixel, etc.)</li>
                  <li>Creates nodes on canvas for easy validation</li>
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

              {/* Live Logs */}
              <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-xs max-h-80 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
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
                    Found {result.scripts.length} scripts
                    {result.gtm_detected && ' (GTM detected)'}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Detected Tags:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {result.tracking_ids.gtm_containers.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">GTM Containers:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.gtm_containers.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.ga4_properties.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">GA4 Properties:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.ga4_properties.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.meta_pixels.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Meta Pixels:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.meta_pixels.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.google_ads.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Google Ads:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.google_ads.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.hotjar_ids.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Hotjar:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.hotjar_ids.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.clarity_ids.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Microsoft Clarity:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.clarity_ids.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.amplitude_keys.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Amplitude:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.amplitude_keys.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.posthog_keys.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">PostHog:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.posthog_keys.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.mixpanel_tokens.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Mixpanel:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.mixpanel_tokens.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.rudderstack_keys.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">RudderStack:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.rudderstack_keys.length}</span>
                    </div>
                  )}
                  {result.tracking_ids.segment_keys.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Segment:</span>{' '}
                      <span className="text-gray-600">{result.tracking_ids.segment_keys.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logs */}
              <details className="bg-gray-50 rounded-md">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100">
                  View Scan Logs
                </summary>
                <div className="bg-gray-900 text-gray-100 rounded-b-md p-4 font-mono text-xs max-h-60 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
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

              {/* Logs */}
              {logs.length > 0 && (
                <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-xs max-h-80 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
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
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Import Tags to Canvas
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
