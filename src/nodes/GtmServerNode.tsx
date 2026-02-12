import type { NodeProps } from '@xyflow/react';
import { Server } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { GtmServerNode as GtmServerNodeType } from '../store/types';

export function GtmServerNode({ data }: NodeProps<GtmServerNodeType>) {
  return (
    <BaseNode label={data.label} icon={<Server size={16} />} color="bg-indigo-700">
      {data.containerId && <p>ID: {data.containerId}</p>}
    </BaseNode>
  );
}
