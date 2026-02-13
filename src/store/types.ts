import type { Node, Edge } from '@xyflow/react';

// --- Tag types ---

export type TagType =
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
  | 'clarity';

// --- Node data types ---

export type WebsiteNodeData = {
  label: string;
  accountId?: string;
  url?: string;
  dataLayerVariables?: string[];
};

export type GtmLoadMethod = 'script' | '1st-party' | 'server-side';

export type GtmContainerNodeData = {
  label: string;
  accountId?: string;
  containerId?: string;
  containerType: 'client' | 'server';
  loadMethod?: GtmLoadMethod;
  customDomain?: string;
};

export type TagNodeData = {
  label: string;
  accountId?: string;
  tagType: TagType;
  trackingId?: string;
  conversionLabel?: string;
  accessToken?: string;
  notes?: string;
};

export type TriggerNodeData = {
  label: string;
  accountId?: string;
  triggerType: 'pageview' | 'click' | 'custom-event' | 'form-submit' | 'scroll' | 'timer' | 'other';
  eventName?: string;
};

export type VariableNodeData = {
  label: string;
  accountId?: string;
  variableType: 'dataLayer' | 'javascript' | 'constant' | 'cookie' | 'url' | 'other';
  variableName?: string;
};

export type DataStreamNodeData = {
  label: string;
  accountId?: string;
  protocol?: 'HTTP' | 'Webhook' | 'API';
};

// --- Node union type for React Flow ---

export type WebsiteNode = Node<WebsiteNodeData, 'website'>;
export type GtmClientNode = Node<GtmContainerNodeData, 'gtmClient'>;
export type GtmServerNode = Node<GtmContainerNodeData, 'gtmServer'>;
export type TagNode = Node<TagNodeData, 'tag'>;
export type TriggerNode = Node<TriggerNodeData, 'trigger'>;
export type VariableNode = Node<VariableNodeData, 'variable'>;
export type DataStreamNode = Node<DataStreamNodeData, 'dataStream'>;

export type AppNode =
  | WebsiteNode
  | GtmClientNode
  | GtmServerNode
  | TagNode
  | TriggerNode
  | VariableNode
  | DataStreamNode;

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
