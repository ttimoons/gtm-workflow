import type { AppNode, AppEdge } from '../store/types';

export type Template = {
  id: string;
  name: string;
  description: string;
  nodes: AppNode[];
  edges: AppEdge[];
};

export const templates: Template[] = [
  {
    id: 'basic-ga4',
    name: 'Basic GA4 Setup',
    description: 'Website with data layer, GTM client container, and GA4 tag',
    nodes: [
      {
        id: 't-website-1',
        type: 'website',
        position: { x: 50, y: 200 },
        data: { label: 'Website', url: 'https://example.com', dataLayerVariables: ['page_view', 'purchase'] },
      },
      {
        id: 't-gtm-client-1',
        type: 'gtmClient',
        position: { x: 350, y: 200 },
        data: { label: 'GTM Client', containerId: 'GTM-XXXXXX', containerType: 'client' as const, loadMethod: 'script' as const },
      },
      {
        id: 't-ga4-1',
        type: 'tag',
        position: { x: 650, y: 150 },
        data: { label: 'GA4', tagType: 'ga4' as const, trackingId: 'G-XXXXXXXXXX' },
      },
      {
        id: 't-trigger-1',
        type: 'trigger',
        position: { x: 350, y: 400 },
        data: { label: 'All Pages', triggerType: 'pageview' as const },
      },
    ] as AppNode[],
    edges: [
      { id: 'te-1', source: 't-website-1', target: 't-gtm-client-1', type: 'dataFlow', animated: true },
      { id: 'te-2', source: 't-gtm-client-1', target: 't-ga4-1', type: 'dataFlow', animated: true },
      { id: 'te-3', source: 't-trigger-1', target: 't-ga4-1', type: 'dataFlow', animated: true },
    ],
  },
  {
    id: 'server-side-facebook-capi',
    name: 'Server-Side with Facebook CAPI',
    description: 'Full server-side setup: Website → GTM Client → GTM Server → GA4 + Meta CAPI + Google Ads',
    nodes: [
      {
        id: 't-website-2',
        type: 'website',
        position: { x: 50, y: 250 },
        data: { label: 'Website', url: 'https://example.com' },
      },
      {
        id: 't-gtm-client-2',
        type: 'gtmClient',
        position: { x: 320, y: 250 },
        data: { label: 'GTM Client', containerId: 'GTM-CLIENT', containerType: 'client' as const, loadMethod: '1st-party' as const, customDomain: 'gtm.example.com' },
      },
      {
        id: 't-stream-1',
        type: 'dataStream',
        position: { x: 580, y: 250 },
        data: { label: 'Data Stream', protocol: 'HTTP' as const },
      },
      {
        id: 't-gtm-server-2',
        type: 'gtmServer',
        position: { x: 830, y: 250 },
        data: { label: 'GTM Server', containerId: 'GTM-SERVER', containerType: 'server' as const, customDomain: 'sgtm.example.com' },
      },
      {
        id: 't-ga4-2',
        type: 'tag',
        position: { x: 1120, y: 100 },
        data: { label: 'GA4', tagType: 'ga4' as const, trackingId: 'G-XXXXXXXXXX' },
      },
      {
        id: 't-meta-2',
        type: 'tag',
        position: { x: 1120, y: 250 },
        data: { label: 'Meta CAPI', tagType: 'meta-pixel' as const, accessToken: '', notes: 'Conversions API' },
      },
      {
        id: 't-gads-2',
        type: 'tag',
        position: { x: 1120, y: 400 },
        data: { label: 'Google Ads', tagType: 'google-ads' as const, trackingId: 'AW-XXXXXXXXX', conversionLabel: '' },
      },
    ] as AppNode[],
    edges: [
      { id: 'te2-1', source: 't-website-2', target: 't-gtm-client-2', type: 'dataFlow', animated: true },
      { id: 'te2-2', source: 't-gtm-client-2', target: 't-stream-1', type: 'dataFlow', animated: true },
      { id: 'te2-3', source: 't-stream-1', target: 't-gtm-server-2', type: 'dataFlow', animated: true },
      { id: 'te2-4', source: 't-gtm-server-2', target: 't-ga4-2', type: 'dataFlow', animated: true },
      { id: 'te2-5', source: 't-gtm-server-2', target: 't-meta-2', type: 'dataFlow', animated: true },
      { id: 'te2-6', source: 't-gtm-server-2', target: 't-gads-2', type: 'dataFlow', animated: true },
    ],
  },
  {
    id: 'multi-platform-ecommerce',
    name: 'Multi-Platform E-commerce',
    description: 'E-commerce tracking with GA4, Meta Pixel, TikTok, and LinkedIn via client-side GTM',
    nodes: [
      {
        id: 't-website-3',
        type: 'website',
        position: { x: 50, y: 280 },
        data: { label: 'E-commerce Website', dataLayerVariables: ['purchase', 'add_to_cart', 'view_item'] },
      },
      {
        id: 't-gtm-client-3',
        type: 'gtmClient',
        position: { x: 350, y: 280 },
        data: { label: 'GTM Client', containerId: 'GTM-ECOMM', containerType: 'client' as const, loadMethod: 'script' as const },
      },
      {
        id: 't-ga4-3',
        type: 'tag',
        position: { x: 680, y: 80 },
        data: { label: 'GA4', tagType: 'ga4' as const, trackingId: 'G-XXXXXXXXXX' },
      },
      {
        id: 't-meta-3',
        type: 'tag',
        position: { x: 680, y: 220 },
        data: { label: 'Meta Pixel', tagType: 'meta-pixel' as const },
      },
      {
        id: 't-tiktok-3',
        type: 'tag',
        position: { x: 680, y: 360 },
        data: { label: 'TikTok Pixel', tagType: 'tiktok' as const },
      },
      {
        id: 't-linkedin-3',
        type: 'tag',
        position: { x: 680, y: 500 },
        data: { label: 'LinkedIn Insight', tagType: 'linkedin' as const },
      },
      {
        id: 't-trigger-3',
        type: 'trigger',
        position: { x: 350, y: 500 },
        data: { label: 'Purchase Event', triggerType: 'custom-event' as const, eventName: 'purchase' },
      },
    ] as AppNode[],
    edges: [
      { id: 'te3-1', source: 't-website-3', target: 't-gtm-client-3', type: 'dataFlow', animated: true },
      { id: 'te3-2', source: 't-gtm-client-3', target: 't-ga4-3', type: 'dataFlow', animated: true },
      { id: 'te3-3', source: 't-gtm-client-3', target: 't-meta-3', type: 'dataFlow', animated: true },
      { id: 'te3-4', source: 't-gtm-client-3', target: 't-tiktok-3', type: 'dataFlow', animated: true },
      { id: 'te3-5', source: 't-gtm-client-3', target: 't-linkedin-3', type: 'dataFlow', animated: true },
      { id: 'te3-6', source: 't-trigger-3', target: 't-ga4-3', type: 'dataFlow', animated: true },
    ],
  },
  {
    id: 'hybrid-client-server',
    name: 'Hybrid Client + Server',
    description: 'Client-side for analytics, server-side for conversion tracking (Meta CAPI, Google Ads)',
    nodes: [
      {
        id: 't-website-4',
        type: 'website',
        position: { x: 50, y: 250 },
        data: { label: 'Website' },
      },
      {
        id: 't-gtm-client-4',
        type: 'gtmClient',
        position: { x: 320, y: 250 },
        data: { label: 'GTM Client', containerType: 'client' as const, loadMethod: '1st-party' as const, customDomain: 'gtm.example.com' },
      },
      {
        id: 't-ga4-4',
        type: 'tag',
        position: { x: 620, y: 100 },
        data: { label: 'GA4 (Client)', tagType: 'ga4' as const, notes: 'Client-side analytics' },
      },
      {
        id: 't-hotjar-4',
        type: 'tag',
        position: { x: 620, y: 240 },
        data: { label: 'Hotjar', tagType: 'hotjar' as const, notes: 'Heatmaps & recordings' },
      },
      {
        id: 't-stream-4',
        type: 'dataStream',
        position: { x: 620, y: 400 },
        data: { label: 'Server Stream', protocol: 'HTTP' as const },
      },
      {
        id: 't-gtm-server-4',
        type: 'gtmServer',
        position: { x: 900, y: 400 },
        data: { label: 'GTM Server', containerType: 'server' as const, customDomain: 'sgtm.example.com' },
      },
      {
        id: 't-meta-4',
        type: 'tag',
        position: { x: 1180, y: 330 },
        data: { label: 'Meta CAPI', tagType: 'meta-pixel' as const, accessToken: '', notes: 'Server-side conversions' },
      },
      {
        id: 't-gads-4',
        type: 'tag',
        position: { x: 1180, y: 470 },
        data: { label: 'Google Ads', tagType: 'google-ads' as const, conversionLabel: '', notes: 'Enhanced conversions' },
      },
    ] as AppNode[],
    edges: [
      { id: 'te4-1', source: 't-website-4', target: 't-gtm-client-4', type: 'dataFlow', animated: true },
      { id: 'te4-2', source: 't-gtm-client-4', target: 't-ga4-4', type: 'dataFlow', animated: true },
      { id: 'te4-3', source: 't-gtm-client-4', target: 't-hotjar-4', type: 'dataFlow', animated: true },
      { id: 'te4-4', source: 't-gtm-client-4', target: 't-stream-4', type: 'dataFlow', animated: true },
      { id: 'te4-5', source: 't-stream-4', target: 't-gtm-server-4', type: 'dataFlow', animated: true },
      { id: 'te4-6', source: 't-gtm-server-4', target: 't-meta-4', type: 'dataFlow', animated: true },
      { id: 'te4-7', source: 't-gtm-server-4', target: 't-gads-4', type: 'dataFlow', animated: true },
    ],
  },
];
