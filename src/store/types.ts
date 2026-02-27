import type { Node, Edge } from '@xyflow/react';

// --- Tag types ---

export type TagType =
  | 'google-tag'
  | 'ga4'
  | 'meta-pixel'
  | 'google-ads'
  | 'tiktok'
  | 'linkedin'
  | 'pinterest'
  | 'snapchat'
  | 'twitter'
  | 'custom-html'
  | 'floodlight'
  | 'hotjar'
  | 'clarity'
  | 'amplitude'
  | 'posthog'
  | 'mixpanel'
  | 'rudderstack'
  | 'segment'
  | 'data-tag'
  | 'cmp';

// --- Exposure / vulnerability flags ---

export type ExposureFlag = 'itp' | 'ad-blocker' | 'client-side';

// --- Node data types ---

export type WebsiteNodeData = {
  label: string;
  accountId?: string;
  url?: string;
  dataLayerVariables?: string[];
  temporary?: boolean;
};

export type GtmLoadMethod = 'script' | '1st-party' | 'server-side' | 'gateway';

export type GtmContainerNodeData = {
  label: string;
  accountId?: string;
  containerId?: string;
  containerType: 'client' | 'server';
  loadMethod?: GtmLoadMethod;
  customDomain?: string;
  exposure?: ExposureFlag[];
  temporary?: boolean;
};

export type CmpMode = 'native' | 'gtm';

export type TagNodeData = {
  label: string;
  accountId?: string;
  tagType: TagType;
  trackingId?: string;
  propertyName?: string;
  streamName?: string;
  eventName?: string;
  conversionLabel?: string;
  accessToken?: string;
  cmpMode?: CmpMode;
  exposure?: ExposureFlag[];
  notes?: string;
  temporary?: boolean;
};

export type TriggerNodeData = {
  label: string;
  accountId?: string;
  triggerType: 'pageview' | 'click' | 'custom-event' | 'form-submit' | 'scroll' | 'timer' | 'other';
  eventName?: string;
  temporary?: boolean;
};

export type VariableNodeData = {
  label: string;
  accountId?: string;
  variableType: 'dataLayer' | 'javascript' | 'constant' | 'cookie' | 'url' | 'other';
  variableName?: string;
  temporary?: boolean;
};

export type DataStreamNodeData = {
  label: string;
  accountId?: string;
  protocol?: 'HTTP' | 'Webhook' | 'API';
  temporary?: boolean;
};

export type ZoneNodeData = {
  label: string;
  color: string;
  temporary?: boolean;
};

// --- Node union type for React Flow ---

export type WebsiteNode = Node<WebsiteNodeData, 'website'>;
export type GtmClientNode = Node<GtmContainerNodeData, 'gtmClient'>;
export type GtmServerNode = Node<GtmContainerNodeData, 'gtmServer'>;
export type TagNode = Node<TagNodeData, 'tag'>;
export type TriggerNode = Node<TriggerNodeData, 'trigger'>;
export type VariableNode = Node<VariableNodeData, 'variable'>;
export type DataStreamNode = Node<DataStreamNodeData, 'dataStream'>;
export type ZoneNode = Node<ZoneNodeData, 'zone'>;

export type AppNode =
  | WebsiteNode
  | GtmClientNode
  | GtmServerNode
  | TagNode
  | TriggerNode
  | VariableNode
  | DataStreamNode
  | ZoneNode;

// --- Edge type ---

export type AppEdge = Edge & {
  data?: { label?: string };
};

// --- Project type ---

export type Project = {
  id: string;
  name: string;
  description?: string;
  nodes: AppNode[];
  edges: AppEdge[];
  createdAt: string;
  updatedAt: string;
};
