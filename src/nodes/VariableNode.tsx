import type { NodeProps } from '@xyflow/react';
import { Braces } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { VariableNode as VariableNodeType } from '../store/types';

export function VariableNode({ id, data }: NodeProps<VariableNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      label={data.label}
      accountId={data.accountId}
      idPlaceholder="Variable name"
      icon={<Braces size={16} />}
      color="bg-purple-500"
    >
      <p className="mb-0.5">Type: {data.variableType}</p>
      {data.variableName && <p className="text-gray-400">Name: {data.variableName}</p>}
    </BaseNode>
  );
}
