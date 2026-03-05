import type { NodeProps } from '@xyflow/react';
import type { ChangeEvent } from 'react';
import { BaseNode } from './BaseNode';
import type { TagNode as TagNodeType, CmpMode } from '../store/types';
import { getTagConfig } from '../data/tagRegistry';
import { useFlowStore } from '../store/useFlowStore';

const CMP_MODES: { value: CmpMode; label: string }[] = [
  { value: 'native', label: 'Native (script)' },
  { value: 'gtm', label: 'Via GTM' },
];

export function TagNode({ id, data, selected }: NodeProps<TagNodeType>) {
  const config = getTagConfig(data.tagType);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const onExtraFieldChange = (key: string) => (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { [key]: e.target.value });
  };

  const onCmpModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { cmpMode: e.target.value as CmpMode });
  };

  return (
    <BaseNode
      nodeId={id}
      label={data.label}
      accountId={data.accountId}
      idPlaceholder={config.idPlaceholder}
      icon={config.icon}
      color={config.color}
      selected={selected}
      exposure={data.exposure}
      showExposure
      temporary={data.temporary}
    >
      {/* CMP mode selector */}
      {data.tagType === 'cmp' && (
        <div className="mb-1">
          <select
            value={data.cmpMode ?? 'native'}
            onChange={onCmpModeChange}
            className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200
                       rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1
                       focus:ring-blue-200 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
          >
            {CMP_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      )}
      {config.extraFields && config.extraFields.length > 0 && (
        <div className="flex flex-col gap-1 mb-1">
          {config.extraFields.map((field) => (
            <input
              key={field.key}
              value={(data as Record<string, unknown>)[field.key] as string ?? ''}
              onChange={onExtraFieldChange(field.key)}
              placeholder={field.placeholder}
              className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200
                         rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1
                         focus:ring-blue-200 placeholder-gray-400 font-mono dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-500"
              spellCheck={false}
            />
          ))}
        </div>
      )}
      {data.notes && <p className="text-gray-400 dark:text-slate-400">{data.notes}</p>}
    </BaseNode>
  );
}
