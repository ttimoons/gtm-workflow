import type { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { WebsiteNode as WebsiteNodeType } from '../store/types';

export function WebsiteNode({ id, data, selected }: NodeProps<WebsiteNodeType>) {
  return (
    <BaseNode
      nodeId={id}
      label={data.label}
      accountId={data.accountId}
      idPlaceholder="Domain (example.com)"
      icon={<Globe size={16} />}
      color="bg-emerald-600"
      selected={selected}
      temporary={data.temporary}
    >
      {data.url && <p className="mb-0.5">{data.url}</p>}
      {data.dataLayerVariables && data.dataLayerVariables.length > 0 && (
        <p className="text-gray-400">DL: {data.dataLayerVariables.join(', ')}</p>
      )}
    </BaseNode>
  );
}
