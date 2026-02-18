import type { NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { TriggerNode as TriggerNodeType } from '../store/types';

export function TriggerNode({ id, data, selected }: NodeProps<TriggerNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      label={data.label}
      accountId={data.accountId}
      idPlaceholder="Trigger ID"
      icon={<Zap size={16} />}
      color="bg-amber-500"
      selected={selected}
      temporary={data.temporary}
    >
      <p className="mb-0.5">Type: {data.triggerType}</p>
      {data.eventName && <p className="text-gray-400">Event: {data.eventName}</p>}
    </BaseNode>
  );
}
