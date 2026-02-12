import type { NodeProps } from '@xyflow/react';
import { Container } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { GtmClientNode as GtmClientNodeType } from '../store/types';

export function GtmClientNode({ data }: NodeProps<GtmClientNodeType>) {
  return (
    <BaseNode label={data.label} icon={<Container size={16} />} color="bg-blue-600">
      {data.containerId && <p>ID: {data.containerId}</p>}
    </BaseNode>
  );
}
