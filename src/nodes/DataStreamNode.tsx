import type { NodeProps } from '@xyflow/react';
import { ArrowRightLeft } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { DataStreamNode as DataStreamNodeType } from '../store/types';

export function DataStreamNode({ id, data }: NodeProps<DataStreamNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      label={data.label}
      accountId={data.accountId}
      idPlaceholder="Stream ID"
      icon={<ArrowRightLeft size={16} />}
      color="bg-cyan-500"
    >
      {data.protocol && <p>Protocol: {data.protocol}</p>}
    </BaseNode>
  );
}
