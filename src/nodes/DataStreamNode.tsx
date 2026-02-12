import type { NodeProps } from '@xyflow/react';
import { ArrowRightLeft } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { DataStreamNode as DataStreamNodeType } from '../store/types';

export function DataStreamNode({ data }: NodeProps<DataStreamNodeType>) {
  return (
    <BaseNode label={data.label} icon={<ArrowRightLeft size={16} />} color="bg-cyan-500">
      {data.protocol && <p>Protocol: {data.protocol}</p>}
    </BaseNode>
  );
}
