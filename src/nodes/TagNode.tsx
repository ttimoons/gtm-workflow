import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { TagNode as TagNodeType } from '../store/types';
import { getTagConfig } from '../data/tagRegistry';

export function TagNode({ data }: NodeProps<TagNodeType>) {
  const config = getTagConfig(data.tagType);

  return (
    <BaseNode label={data.label} icon={config.icon} color={config.color}>
      {data.trackingId && <p className="mb-0.5">ID: {data.trackingId}</p>}
      {data.notes && <p className="text-gray-400">{data.notes}</p>}
    </BaseNode>
  );
}
