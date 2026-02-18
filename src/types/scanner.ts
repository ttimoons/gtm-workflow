export interface ScriptRecord {
  url: string;
  name: string;
  vendor: string;
  via_gtm: boolean;
  type: 'inline' | 'external';
}

export interface TrackingIds {
  gtm_containers: string[];
  ga4_properties: string[];
  meta_pixels: string[];
  google_ads: string[];
  tiktok_pixels: string[];
  linkedin_tags: string[];
  twitter_pixels: string[];
  hotjar_ids: string[];
  clarity_ids: string[];
  amplitude_keys: string[];
  posthog_keys: string[];
  mixpanel_tokens: string[];
  rudderstack_keys: string[];
  segment_keys: string[];
}

export interface AuditResult {
  url: string;
  scanned_at: string;
  gtm_detected: boolean;
  error: string | null;
  scripts: ScriptRecord[];
  tracking_ids: TrackingIds;
}

export type ScanStage = 'input' | 'scanning' | 'results' | 'error';

export interface SSEEvent {
  type: 'status' | 'log' | 'result' | 'error' | 'done';
  message?: string;
  data?: AuditResult;
}
