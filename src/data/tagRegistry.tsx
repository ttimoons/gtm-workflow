import type { ReactNode } from 'react';
import { Code, BarChart3, MousePointer2, Database, Shield } from 'lucide-react';
import type { TagType } from '../store/types';

export type TagExtraField = {
  key: string;
  placeholder: string;
};

export type TagConfig = {
  label: string;
  color: string;
  icon: ReactNode;
  idPlaceholder: string;
  extraFields?: TagExtraField[];
};

function SvgIcon({ children, viewBox = '0 0 24 24' }: { children: ReactNode; viewBox?: string }) {
  return (
    <svg width="16" height="16" viewBox={viewBox} fill="currentColor" className="shrink-0">
      {children}
    </svg>
  );
}

const TAG_CONFIGS: Record<TagType, TagConfig> = {
  'google-tag': {
    label: 'Google Tag',
    color: 'bg-blue-500',
    idPlaceholder: 'GT-XXXXXX / G-XXXXXXXXXX',
    extraFields: [
      { key: 'propertyName', placeholder: 'GA4 Property name' },
      { key: 'streamName', placeholder: 'Stream name' },
    ],
    icon: (
      <SvgIcon>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </SvgIcon>
    ),
  },
  'ga4': {
    label: 'GA4 Event',
    color: 'bg-orange-500',
    idPlaceholder: 'G-XXXXXXXXXX',
    extraFields: [
      { key: 'propertyName', placeholder: 'GA4 Property name' },
      { key: 'streamName', placeholder: 'Stream name' },
      { key: 'eventName', placeholder: 'Event name (e.g. purchase)' },
    ],
    icon: (
      <SvgIcon>
        <path d="M22 3.41l-.12-1.26-1.2.4a12.84 12.84 0 0 0-3.67 1.87A13.34 13.34 0 0 0 12 0a13.34 13.34 0 0 0-5 4.42A12.84 12.84 0 0 0 3.32 2.55l-1.2-.4L2 3.41A13.49 13.49 0 0 0 2 12a10 10 0 0 0 20 0A13.49 13.49 0 0 0 22 3.41Z" />
      </SvgIcon>
    ),
  },
  'meta-pixel': {
    label: 'Meta Pixel',
    color: 'bg-blue-600',
    idPlaceholder: 'Pixel ID (e.g. 123456789)',
    extraFields: [
      { key: 'accessToken', placeholder: 'Access Token (CAPI)' },
    ],
    icon: (
      <SvgIcon viewBox="0 0 36 36">
        <path d="M18 2C9.16 2 2 9.16 2 18s7.16 16 16 16 16-7.16 16-16S26.84 2 18 2zm5.12 22.44c-.96 0-1.76-.44-2.84-1.72l-2.32-2.8-2.92 4.36c-.2.28-.4.36-.68.36-.44 0-.84-.32-.84-.8 0-.2.08-.4.2-.6l3.36-4.84-3.2-3.88c-.16-.2-.24-.4-.24-.64 0-.44.36-.8.8-.8.32 0 .56.12.76.4l2.16 2.64 2.76-4.12c.2-.28.4-.4.68-.4.44 0 .84.32.84.76 0 .2-.08.4-.2.56l-3.2 4.6 3.36 4.12c.16.2.24.4.24.64 0 .44-.36.76-.72.76z" />
      </SvgIcon>
    ),
  },
  'google-ads': {
    label: 'Google Ads',
    color: 'bg-yellow-500',
    idPlaceholder: 'AW-XXXXXXXXX / XXXXXXXXX',
    extraFields: [
      { key: 'conversionLabel', placeholder: 'Conversion Label' },
    ],
    icon: (
      <SvgIcon>
        <path d="M3.27 20.34L10.64 4.34C11.09 3.38 12.15 2.95 13.11 3.4L13.31 3.5C14.27 3.95 14.7 5.01 14.25 5.97L6.88 21.97C6.43 22.93 5.37 23.36 4.41 22.91L4.21 22.81C3.25 22.36 2.82 21.3 3.27 20.34Z" />
        <path d="M9.72 20.34L17.09 4.34C17.54 3.38 18.6 2.95 19.56 3.4L19.76 3.5C20.72 3.95 21.15 5.01 20.7 5.97L13.33 21.97C12.88 22.93 11.82 23.36 10.86 22.91L10.66 22.81C9.7 22.36 9.27 21.3 9.72 20.34Z" />
      </SvgIcon>
    ),
  },
  'tiktok': {
    label: 'TikTok Pixel',
    color: 'bg-gray-900',
    idPlaceholder: 'Pixel ID (e.g. CXXXXXXX)',
    icon: (
      <SvgIcon>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.93 2.93 0 0 1 .88.13V9.04a6.28 6.28 0 0 0-.88-.07 6.28 6.28 0 0 0 0 12.56 6.29 6.29 0 0 0 6.28-6.29V9.4a8.16 8.16 0 0 0 3.82.95V6.97a4.83 4.83 0 0 1-.88-.13l-.12-.15Z" />
      </SvgIcon>
    ),
  },
  'linkedin': {
    label: 'LinkedIn Insight',
    color: 'bg-sky-700',
    idPlaceholder: 'Partner ID (e.g. 123456)',
    icon: (
      <SvgIcon>
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
      </SvgIcon>
    ),
  },
  'pinterest': {
    label: 'Pinterest Tag',
    color: 'bg-red-600',
    idPlaceholder: 'Tag ID (e.g. 123456789)',
    icon: (
      <SvgIcon>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.63 11.15-.1-.95-.2-2.41.04-3.44.22-.94 1.4-5.94 1.4-5.94s-.36-.71-.36-1.77c0-1.66.96-2.89 2.16-2.89 1.02 0 1.51.77 1.51 1.68 0 1.03-.65 2.56-.99 3.98-.28 1.19.6 2.16 1.77 2.16 2.13 0 3.77-2.25 3.77-5.49 0-2.87-2.06-4.87-5.01-4.87-3.41 0-5.42 2.56-5.42 5.2 0 1.03.4 2.13.89 2.73.1.12.11.22.08.34-.09.38-.3 1.19-.34 1.36-.05.22-.18.27-.41.16-1.53-.71-2.49-2.95-2.49-4.75 0-3.87 2.81-7.42 8.1-7.42 4.25 0 7.56 3.03 7.56 7.08 0 4.23-2.66 7.63-6.36 7.63-1.24 0-2.41-.65-2.81-1.41l-.76 2.92c-.28 1.06-1.03 2.39-1.53 3.2A12 12 0 0024 12c0-6.63-5.37-12-12-12z" />
      </SvgIcon>
    ),
  },
  'snapchat': {
    label: 'Snapchat Pixel',
    color: 'bg-yellow-400',
    idPlaceholder: 'Pixel ID',
    icon: (
      <SvgIcon>
        <path d="M12.07 2C8.61 2 6.16 4.12 5.85 7.53c-.08.97.02 2.05.14 3.22-.62.28-1.2.42-1.56.42-.33 0-.43.32-.43.51 0 .42.42.6.84.78.63.25 1.48.47 1.72.94.1.18.07.42-.08.73-1.04 2.14-2.57 3.22-2.65 3.27-.28.18-.47.45-.39.82.1.45.62.67 1.38.67.3 0 .63-.05.93-.09.27-.04.52-.08.71-.06.39.04.69.36 1.08.78.72.8 1.71 1.88 4.43 1.88h.12c2.72 0 3.71-1.09 4.43-1.88.39-.42.69-.74 1.08-.78.19-.02.44.02.71.06.3.04.63.09.93.09.76 0 1.28-.22 1.38-.67.08-.37-.11-.64-.39-.82-.08-.05-1.61-1.13-2.65-3.27-.15-.31-.18-.55-.08-.73.24-.47 1.09-.69 1.72-.94.42-.17.84-.36.84-.78 0-.19-.1-.51-.43-.51-.36 0-.94-.14-1.56-.42.12-1.17.22-2.25.14-3.22C17.98 4.12 15.53 2 12.07 2z" />
      </SvgIcon>
    ),
  },
  'twitter': {
    label: 'X (Twitter) Pixel',
    color: 'bg-gray-800',
    idPlaceholder: 'Pixel ID (e.g. oXXXX)',
    icon: (
      <SvgIcon>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </SvgIcon>
    ),
  },
  'custom-html': {
    label: 'Custom HTML',
    color: 'bg-gray-600',
    idPlaceholder: 'Tag ID',
    icon: <Code size={16} />,
  },
  'floodlight': {
    label: 'Floodlight',
    color: 'bg-green-600',
    idPlaceholder: 'DC-XXXXXXXX',
    extraFields: [
      { key: 'conversionLabel', placeholder: 'Activity Tag' },
    ],
    icon: <BarChart3 size={16} />,
  },
  'hotjar': {
    label: 'Hotjar',
    color: 'bg-red-500',
    idPlaceholder: 'Site ID (e.g. 1234567)',
    icon: <MousePointer2 size={16} />,
  },
  'clarity': {
    label: 'Microsoft Clarity',
    color: 'bg-blue-500',
    idPlaceholder: 'Project ID',
    icon: <MousePointer2 size={16} />,
  },
  'data-tag': {
    label: 'Data Tag',
    color: 'bg-teal-600',
    idPlaceholder: 'Tag ID / Endpoint',
    extraFields: [
      { key: 'conversionLabel', placeholder: 'Collection endpoint' },
    ],
    icon: <Database size={16} />,
  },
  'cmp': {
    label: 'CMP (Consent)',
    color: 'bg-emerald-700',
    idPlaceholder: 'CMP ID (e.g. OneTrust, Cookiebot)',
    icon: <Shield size={16} />,
  },
};

export function getTagConfig(tagType: TagType): TagConfig {
  return TAG_CONFIGS[tagType];
}

export function getAllTagTypes(): { type: TagType; config: TagConfig }[] {
  return Object.entries(TAG_CONFIGS).map(([type, config]) => ({
    type: type as TagType,
    config,
  }));
}
