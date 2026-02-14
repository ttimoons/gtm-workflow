import { useCallback, useEffect, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  SelectionMode,
} from '@xyflow/react';
import { useFlowStore } from '../store/useFlowStore';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { generateId } from '../utils/idGenerator';
import { AlignmentGuides } from './AlignmentGuides';
import type { AppNode } from '../store/types';

const SNAP_GRID: [number, number] = [10, 10];

function snapPosition(pos: { x: number; y: number }) {
  return {
    x: Math.round(pos.x / SNAP_GRID[0]) * SNAP_GRID[0],
    y: Math.round(pos.y / SNAP_GRID[1]) * SNAP_GRID[1],
  };
}

const NODE_COLOR_MAP: Record<string, string> = {
  website: '#059669',
  gtmClient: '#2563eb',
  gtmServer: '#4338ca',
  tag: '#f97316',
  trigger: '#f59e0b',
  variable: '#a855f7',
  dataStream: '#06b6d4',
};

function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useFlowStore();
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChangeFn = useFlowStore((s) => s.onNodesChange);

  // Keyboard shortcuts: undo/redo + select all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key.toLowerCase();

      // Undo / Redo
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Select all
      if (key === 'a') {
        e.preventDefault();
        const { nodes } = useFlowStore.getState();
        const changes = nodes
          .filter((n) => !n.selected)
          .map((n) => ({ id: n.id, type: 'select' as const, selected: true }));
        if (changes.length > 0) onNodesChangeFn(changes);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, onNodesChangeFn]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      const { nodeType, data } = JSON.parse(rawData);
      const position = snapPosition(
        screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
      );

      addNode({
        id: generateId(),
        type: nodeType,
        position,
        data,
      } as AppNode);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{
        type: 'dataFlow',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      }}
      snapToGrid
      snapGrid={SNAP_GRID}
      selectionOnDrag
      selectionMode={SelectionMode.Partial}
      panOnDrag={[1, 2]}
      panOnScroll
      fitView
      className="bg-gray-50"
      deleteKeyCode={['Backspace', 'Delete']}
      multiSelectionKeyCode="Shift"
    >
      <AlignmentGuides />
      <Background gap={SNAP_GRID[0]} size={1} color="#e5e7eb" />
      <Controls />
      <MiniMap
        nodeStrokeWidth={3}
        nodeColor={(n) => NODE_COLOR_MAP[n.type ?? ''] ?? '#6b7280'}
        className="!bg-white !border-gray-200"
      />
    </ReactFlow>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
