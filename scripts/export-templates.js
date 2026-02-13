#!/usr/bin/env node

/**
 * Exports all built-in templates as project JSON files into public/projects/.
 * Run: node scripts/export-templates.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectsDir = join(__dirname, '..', 'public', 'projects');

const templates = [
  {
    id: 'basic-ga4',
    name: 'Basic GA4 Setup',
    nodes: [
      { id: 't-website-1', type: 'website', position: { x: 50, y: 200 }, data: { label: 'Website', url: 'https://example.com', dataLayerVariables: ['page_view', 'purchase'] } },
      { id: 't-gtm-client-1', type: 'gtmClient', position: { x: 350, y: 200 }, data: { label: 'GTM Client', containerId: 'GTM-XXXXXX', containerType: 'client', loadMethod: 'script' } },
      { id: 't-ga4-1', type: 'tag', position: { x: 650, y: 150 }, data: { label: 'GA4', tagType: 'ga4', trackingId: 'G-XXXXXXXXXX' } },
      { id: 't-trigger-1', type: 'trigger', position: { x: 350, y: 400 }, data: { label: 'All Pages', triggerType: 'pageview' } },
    ],
    edges: [
      { id: 'te-1', source: 't-website-1', target: 't-gtm-client-1', type: 'dataFlow', animated: true },
      { id: 'te-2', source: 't-gtm-client-1', target: 't-ga4-1', type: 'dataFlow', animated: true },
      { id: 'te-3', source: 't-trigger-1', target: 't-ga4-1', type: 'dataFlow', animated: true },
    ],
  },
  {
    id: 'server-side-facebook-capi',
    name: 'Server-Side with Facebook CAPI',
    nodes: [
      { id: 't-website-2', type: 'website', position: { x: 50, y: 250 }, data: { label: 'Website', url: 'https://example.com' } },
      { id: 't-gtm-client-2', type: 'gtmClient', position: { x: 320, y: 250 }, data: { label: 'GTM Client', containerId: 'GTM-CLIENT', containerType: 'client', loadMethod: '1st-party', customDomain: 'gtm.example.com' } },
      { id: 't-stream-1', type: 'dataStream', position: { x: 580, y: 250 }, data: { label: 'Data Stream', protocol: 'HTTP' } },
      { id: 't-gtm-server-2', type: 'gtmServer', position: { x: 830, y: 250 }, data: { label: 'GTM Server', containerId: 'GTM-SERVER', containerType: 'server', customDomain: 'sgtm.example.com' } },
      { id: 't-ga4-2', type: 'tag', position: { x: 1120, y: 100 }, data: { label: 'GA4', tagType: 'ga4', trackingId: 'G-XXXXXXXXXX' } },
      { id: 't-meta-2', type: 'tag', position: { x: 1120, y: 250 }, data: { label: 'Meta CAPI', tagType: 'meta-pixel', accessToken: '', notes: 'Conversions API' } },
      { id: 't-gads-2', type: 'tag', position: { x: 1120, y: 400 }, data: { label: 'Google Ads', tagType: 'google-ads', trackingId: 'AW-XXXXXXXXX', conversionLabel: '' } },
    ],
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
    nodes: [
      { id: 't-website-3', type: 'website', position: { x: 50, y: 280 }, data: { label: 'E-commerce Website', dataLayerVariables: ['purchase', 'add_to_cart', 'view_item'] } },
      { id: 't-gtm-client-3', type: 'gtmClient', position: { x: 350, y: 280 }, data: { label: 'GTM Client', containerId: 'GTM-ECOMM', containerType: 'client', loadMethod: 'script' } },
      { id: 't-ga4-3', type: 'tag', position: { x: 680, y: 80 }, data: { label: 'GA4', tagType: 'ga4', trackingId: 'G-XXXXXXXXXX' } },
      { id: 't-meta-3', type: 'tag', position: { x: 680, y: 220 }, data: { label: 'Meta Pixel', tagType: 'meta-pixel' } },
      { id: 't-tiktok-3', type: 'tag', position: { x: 680, y: 360 }, data: { label: 'TikTok Pixel', tagType: 'tiktok' } },
      { id: 't-linkedin-3', type: 'tag', position: { x: 680, y: 500 }, data: { label: 'LinkedIn Insight', tagType: 'linkedin' } },
      { id: 't-trigger-3', type: 'trigger', position: { x: 350, y: 500 }, data: { label: 'Purchase Event', triggerType: 'custom-event', eventName: 'purchase' } },
    ],
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
    nodes: [
      { id: 't-website-4', type: 'website', position: { x: 50, y: 250 }, data: { label: 'Website' } },
      { id: 't-gtm-client-4', type: 'gtmClient', position: { x: 320, y: 250 }, data: { label: 'GTM Client', containerType: 'client', loadMethod: '1st-party', customDomain: 'gtm.example.com' } },
      { id: 't-ga4-4', type: 'tag', position: { x: 620, y: 100 }, data: { label: 'GA4 (Client)', tagType: 'ga4', notes: 'Client-side analytics' } },
      { id: 't-hotjar-4', type: 'tag', position: { x: 620, y: 240 }, data: { label: 'Hotjar', tagType: 'hotjar', notes: 'Heatmaps & recordings' } },
      { id: 't-stream-4', type: 'dataStream', position: { x: 620, y: 400 }, data: { label: 'Server Stream', protocol: 'HTTP' } },
      { id: 't-gtm-server-4', type: 'gtmServer', position: { x: 900, y: 400 }, data: { label: 'GTM Server', containerType: 'server', customDomain: 'sgtm.example.com' } },
      { id: 't-meta-4', type: 'tag', position: { x: 1180, y: 330 }, data: { label: 'Meta CAPI', tagType: 'meta-pixel', accessToken: '', notes: 'Server-side conversions' } },
      { id: 't-gads-4', type: 'tag', position: { x: 1180, y: 470 }, data: { label: 'Google Ads', tagType: 'google-ads', conversionLabel: '', notes: 'Enhanced conversions' } },
    ],
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

const now = new Date().toISOString();

for (const template of templates) {
  const project = {
    id: template.id,
    name: template.name,
    nodes: template.nodes,
    edges: template.edges,
    createdAt: now,
    updatedAt: now,
  };

  const filename = template.name.replace(/\s+/g, '-').toLowerCase() + '.json';
  writeFileSync(join(projectsDir, filename), JSON.stringify(project, null, 2) + '\n');
  console.log(`  ✓ ${filename}`);
}

console.log(`\n${templates.length} templates exported to public/projects/`);
