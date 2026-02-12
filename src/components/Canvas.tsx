import { useCallback, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import { useFlowStore } from '../store/useFlowStore';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { generateId } from '../utils/idGenerator';
import type { AppNode } from '../store/types';

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
  const { screenToFlowPosition } = useReactFlow();

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
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

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
      fitView
      className="bg-gray-50"
      deleteKeyCode={['Backspace', 'Delete']}
    >
      <Background gap={20} size={1} color="#e5e7eb" />
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
