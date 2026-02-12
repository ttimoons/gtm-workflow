import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

export function DataFlowEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{ stroke: '#6366f1', strokeWidth: 2 }}
      markerEnd={props.markerEnd}
    />
  );
}
