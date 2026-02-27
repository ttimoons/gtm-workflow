import { NodeResizer, type NodeProps } from '@xyflow/react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import type { ZoneNode as ZoneNodeType } from '../store/types';
import { useFlowStore } from '../store/useFlowStore';

const PRESET_COLORS = [
  { value: '#3b82f6', name: 'Blue' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#10b981', name: 'Green' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#f97316', name: 'Orange' },
  { value: '#ef4444', name: 'Red' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#6b7280', name: 'Gray' },
  { value: '#1e293b', name: 'Slate' },
];

export function ZoneNode({ id, data, selected }: NodeProps<ZoneNodeType>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const [showPicker, setShowPicker] = useState(false);

  const color = data.color || '#3b82f6';

  const onLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { label: e.target.value });
  };

  const onColorChange = (newColor: string) => {
    updateNodeData(id, { color: newColor });
    setShowPicker(false);
  };

  return (
    <div
      className="w-full h-full rounded-lg border-2 relative"
      style={{
        borderColor: color,
        backgroundColor: `${color}10`,
        minWidth: 160,
        minHeight: 100,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={100}
        lineStyle={{ borderColor: 'transparent' }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: color,
          border: '2px solid white',
        }}
      />

      {/* Label bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-1.5 px-2 py-1 rounded-t-[calc(0.5rem-2px)]"
        style={{ backgroundColor: `${color}20` }}
      >
        {/* Color dot — opens picker */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
          className="w-4 h-4 rounded-full shrink-0 border-2 border-white shadow-sm hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
          title="Change color"
        />
        <input
          value={data.label}
          onChange={onLabelChange}
          className="bg-transparent border-none outline-none text-xs font-semibold w-full
                     focus:ring-1 focus:ring-black/10 rounded px-1 py-0.5"
          style={{ color }}
          placeholder="Zone label"
          spellCheck={false}
        />
      </div>

      {/* Color picker popover */}
      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute top-8 left-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-1 flex-wrap w-[132px]">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={(e) => { e.stopPropagation(); onColorChange(c.value); }}
                className="w-5 h-5 rounded-full border-2 hover:scale-125 transition-transform"
                style={{
                  backgroundColor: c.value,
                  borderColor: c.value === color ? 'white' : 'transparent',
                  boxShadow: c.value === color ? `0 0 0 2px ${c.value}` : 'none',
                }}
                title={c.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
