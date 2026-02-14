import type { NodeProps } from '@xyflow/react';
import type { ChangeEvent } from 'react';
import { Server } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { GtmServerNode as GtmServerNodeType } from '../store/types';
import { useFlowStore } from '../store/useFlowStore';

export function GtmServerNode({ id, data, selected }: NodeProps<GtmServerNodeType>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const onCustomDomainChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { customDomain: e.target.value });
  };

  return (
    <BaseNode
      nodeId={id}
      label={data.label}
      accountId={data.accountId}
      idPlaceholder="GTM-XXXXXX"
      icon={<Server size={16} />}
      color="bg-indigo-700"
      selected={selected}
    >
      <input
        value={data.customDomain ?? ''}
        onChange={onCustomDomainChange}
        placeholder="Server URL (e.g. sgtm.example.com)"
        className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200
                   rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1
                   focus:ring-blue-200 placeholder-gray-400 font-mono"
        spellCheck={false}
      />
    </BaseNode>
  );
}
