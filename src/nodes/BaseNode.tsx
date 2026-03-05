import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { ReactNode, ChangeEvent, MouseEvent } from 'react';
import { useState, useRef, useLayoutEffect, useCallback } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState({ w: 200, h: 80 });

  const measureContent = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    // Temporarily remove size constraints to measure natural content size
    const prevWidth = el.style.width;
    const prevHeight = el.style.height;
    el.style.width = 'min-content';
    el.style.height = 'auto';
    const w = Math.ceil(el.scrollWidth) + 4; // +4 for border
    const h = Math.ceil(el.scrollHeight) + 4;
    el.style.width = prevWidth;
    el.style.height = prevHeight;
    setContentSize({ w: Math.max(200, w), h: Math.max(80, h) });
  }, []);

  useLayoutEffect(() => {
    measureContent();
  }, [label, accountId, children, showExposure, exposure, measureContent]);

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
    : 'border-gray-200 dark:border-slate-600';

  return (
    <>
      <div
        ref={contentRef}
        className={`rounded-lg shadow-md border-2 bg-white min-w-[200px] min-h-[80px] w-full h-full text-left transition-shadow relative dark:bg-slate-800 ${borderClass} ${temporary ? 'opacity-85' : ''}`}
        onContextMenu={handleContextMenu}
        onClick={() => setShowContextMenu(false)}
      >
        <NodeResizer
          isVisible={selected}
          minWidth={contentSize.w}
          minHeight={contentSize.h}
          lineStyle={{ borderColor: 'transparent' }}
          handleStyle={{
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: '#3b82f6',
            border: '2px solid white',
          }}
        />
        {temporary && (
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
            PENDING
          </div>
        )}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white dark:!bg-slate-500 dark:!border-slate-800"
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
      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-slate-700">
        <input
          value={accountId ?? ''}
          onChange={onAccountIdChange}
          placeholder={idPlaceholder}
          className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200
                     rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1
                     focus:ring-blue-200 placeholder-gray-400 font-mono dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-500"
          spellCheck={false}
        />
      </div>

      {/* Extra details */}
      {children && (
        <div className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-300">{children}</div>
      )}

      {/* Exposure badges */}
      {showExposure && (
        <div className="px-3 py-1.5 border-t border-gray-100 dark:border-slate-700">
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
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-800"
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
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] dark:bg-slate-800 dark:border-slate-700"
            style={{
              left: `${contextMenuPos.x}px`,
              top: `${contextMenuPos.y}px`,
            }}
          >
            <button
              onClick={handleConfirm}
              className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-gray-700 hover:text-green-700 flex items-center gap-2 transition-colors dark:text-slate-200 dark:hover:bg-green-500/10 dark:hover:text-green-300"
            >
              <Check size={14} />
              Confirm Tag
            </button>
            <div className="h-px bg-gray-200 my-1 dark:bg-slate-700" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-gray-700 hover:text-red-700 flex items-center gap-2 transition-colors dark:text-slate-200 dark:hover:bg-red-500/10 dark:hover:text-red-300"
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
