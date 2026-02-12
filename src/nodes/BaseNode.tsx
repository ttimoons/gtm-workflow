import { Handle, Position } from '@xyflow/react';
import type { ReactNode } from 'react';

type BaseNodeProps = {
  label: string;
  icon: ReactNode;
  color: string;
  children?: ReactNode;
};

export function BaseNode({ label, icon, color, children }: BaseNodeProps) {
  return (
    <div className="rounded-lg shadow-md border border-gray-200 bg-white min-w-[180px] max-w-[240px] text-left">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      <div
        className={`${color} text-white px-3 py-2 rounded-t-lg flex items-center gap-2 text-sm font-medium`}
      >
        {icon}
        <span className="truncate">{label}</span>
      </div>

      {children && (
        <div className="px-3 py-2 text-xs text-gray-600">{children}</div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}
