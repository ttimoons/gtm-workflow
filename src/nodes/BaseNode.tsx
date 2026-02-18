import { Handle, Position } from '@xyflow/react';
import type { ReactNode, ChangeEvent, MouseEvent } from 'react';
import { useState } from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { ExposureBadges } from '../components/ExposureBadges';
import type { ExposureFlag } from '../store/types';
import { Check, Trash2 } from 'lucide-react';

type BaseNodeProps = {
  nodeId: string;
  label: string;
  accountId?: string;
  idPlaceholder?: string;
  icon: ReactNode;
  color: string;
  selected?: boolean;
  exposure?: ExposureFlag[];
  showExposure?: boolean;
  temporary?: boolean;
  children?: ReactNode;
};

export function BaseNode({
  nodeId,
  label,
  accountId,
  idPlaceholder = 'Account ID',
  icon,
  color,
  selected = false,
  exposure,
  showExposure = false,
  temporary = false,
  children,
}: BaseNodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const confirmNode = useFlowStore((s) => s.confirmNode);
  const nodes = useFlowStore((s) => s.nodes);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const onLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(nodeId, { label: e.target.value });
  };

  const onAccountIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(nodeId, { accountId: e.target.value });
  };

  const onExposureToggle = (_nodeId: string, flag: ExposureFlag) => {
    const current = exposure ?? [];
    const next = current.includes(flag)
      ? current.filter((f) => f !== flag)
      : [...current, flag];
    updateNodeData(nodeId, { exposure: next });
  };

  const handleContextMenu = (e: MouseEvent) => {
    if (!temporary) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleConfirm = () => {
    confirmNode(nodeId);
    setShowContextMenu(false);
  };

  const handleDelete = () => {
    const nodeToDelete = nodes.find((n) => n.id === nodeId);
    if (nodeToDelete) {
      useFlowStore.getState().onNodesChange([{ type: 'remove', id: nodeId }]);
    }
    setShowContextMenu(false);
  };

  const hasExposure = exposure && exposure.length > 0;

  const borderClass = temporary
    ? 'border-orange-500 border-dashed'
    : selected
    ? 'border-blue-500 ring-2 ring-blue-200'
    : hasExposure
    ? 'border-amber-400'
    : 'border-gray-200';

  return (
    <>
      <div
        className={`rounded-lg shadow-md border-2 bg-white min-w-[200px] max-w-[260px] text-left transition-shadow relative ${borderClass} ${temporary ? 'opacity-85' : ''}`}
        onContextMenu={handleContextMenu}
        onClick={() => setShowContextMenu(false)}
      >
        {temporary && (
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
            PENDING
          </div>
        )}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
          style={{ top: 20 }}
        />

      {/* Header with editable label */}
      <div
        className={`${color} text-white px-3 py-2 rounded-t-[calc(0.5rem-2px)] flex items-center gap-2 text-sm font-medium`}
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

      {/* Exposure badges */}
      {showExposure && (
        <div className="px-3 py-1.5 border-t border-gray-100">
          <ExposureBadges
            nodeId={nodeId}
            exposure={exposure}
            onToggle={onExposureToggle}
          />
        </div>
      )}

        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
          style={{ top: 20 }}
        />
      </div>

      {/* Context menu for temporary nodes */}
      {showContextMenu && temporary && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
            style={{
              left: `${contextMenuPos.x}px`,
              top: `${contextMenuPos.y}px`,
            }}
          >
            <button
              onClick={handleConfirm}
              className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-gray-700 hover:text-green-700 flex items-center gap-2 transition-colors"
            >
              <Check size={14} />
              Confirm Tag
            </button>
            <div className="h-px bg-gray-200 my-1" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-gray-700 hover:text-red-700 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
