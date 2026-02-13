import { Handle, Position } from '@xyflow/react';
import type { ReactNode, ChangeEvent } from 'react';
import { useFlowStore } from '../store/useFlowStore';

type BaseNodeProps = {
  nodeId: string;
  label: string;
  accountId?: string;
  idPlaceholder?: string;
  icon: ReactNode;
  color: string;
  children?: ReactNode;
};

export function BaseNode({
  nodeId,
  label,
  accountId,
  idPlaceholder = 'Account ID',
  icon,
  color,
  children,
}: BaseNodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const onLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(nodeId, { label: e.target.value });
  };

  const onAccountIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(nodeId, { accountId: e.target.value });
  };

  return (
    <div className="rounded-lg shadow-md border border-gray-200 bg-white min-w-[200px] max-w-[260px] text-left">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Header with editable label */}
      <div
        className={`${color} text-white px-3 py-2 rounded-t-lg flex items-center gap-2 text-sm font-medium`}
      >
        <span className="shrink-0">{icon}</span>
        <input
          value={label}
          onChange={onLabelChange}
          className="bg-transparent text-white placeholder-white/50 border-none outline-none
                     w-full text-sm font-medium truncate focus:ring-1 focus:ring-white/30
                     rounded px-0.5"
          spellCheck={false}
        />
      </div>

      {/* ID field */}
      <div className="px-3 py-1.5 border-b border-gray-100">
        <input
          value={accountId ?? ''}
          onChange={onAccountIdChange}
          placeholder={idPlaceholder}
          className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200
                     rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1
                     focus:ring-blue-200 placeholder-gray-400 font-mono"
          spellCheck={false}
        />
      </div>

      {/* Extra details */}
      {children && (
        <div className="px-3 py-1.5 text-xs text-gray-600">{children}</div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}
