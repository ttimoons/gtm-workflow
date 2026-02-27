import type { NodeTypes } from '@xyflow/react';
import { WebsiteNode } from './WebsiteNode';
import { GtmClientNode } from './GtmClientNode';
import { GtmServerNode } from './GtmServerNode';
import { TagNode } from './TagNode';
import { TriggerNode } from './TriggerNode';
import { VariableNode } from './VariableNode';
import { DataStreamNode } from './DataStreamNode';
import { ZoneNode } from './ZoneNode';

// Defined at module level to prevent React Flow re-renders
export const nodeTypes: NodeTypes = {
  website: WebsiteNode,
  gtmClient: GtmClientNode,
  gtmServer: GtmServerNode,
  tag: TagNode,
  trigger: TriggerNode,
  variable: VariableNode,
  dataStream: DataStreamNode,
  zone: ZoneNode,
};
