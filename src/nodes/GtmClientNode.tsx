import type { NodeProps } from '@xyflow/react';
import type { ChangeEvent } from 'react';
import { Container } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { GtmClientNode as GtmClientNodeType, GtmLoadMethod } from '../store/types';
import { useFlowStore } from '../store/useFlowStore';

const LOAD_METHODS: { value: GtmLoadMethod; label: string }[] = [
  { value: 'script', label: 'Standard (gtm.js)' },
  { value: '1st-party', label: '1st Party (custom domain)' },
  { value: 'server-side', label: 'Server-side injected' },
];

export function GtmClientNode({ id, data }: NodeProps<GtmClientNodeType>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const onLoadMethodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { loadMethod: e.target.value });
  };

  const onCustomDomainChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { customDomain: e.target.value });
  };

  return (
    <BaseNode
      nodeId={id}
      label={data.label}
      accountId={data.accountId}
      idPlaceholder="GTM-XXXXXX"
      icon={<Container size={16} />}
      color="bg-blue-600"
    >
      <div className="flex flex-col gap-1">
        <select
          value={data.loadMethod ?? 'script'}
          onChange={onLoadMethodChange}
          className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200
                     rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1
                     focus:ring-blue-200"
        >
          {LOAD_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {(data.loadMethod === '1st-party' || data.loadMethod === 'server-side') && (
          <input
            value={data.customDomain ?? ''}
            onChange={onCustomDomainChange}
            placeholder="Custom domain (e.g. gtm.example.com)"
            className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200
                       rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1
                       focus:ring-blue-200 placeholder-gray-400 font-mono"
            spellCheck={false}
          />
        )}
      </div>
    </BaseNode>
  );
}
