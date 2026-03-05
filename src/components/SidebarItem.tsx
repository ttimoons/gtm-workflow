import type { ReactNode, DragEvent } from 'react';

type SidebarItemProps = {
  nodeType: string;
  label: string;
  icon: ReactNode;
  color: string;
  data?: Record<string, unknown>;
};

export function SidebarItem({ nodeType, label, icon, color, data }: SidebarItemProps) {
  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType, data: { label, ...data } })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-3 py-2 rounded-md cursor-grab
                 hover:bg-gray-100 active:cursor-grabbing transition-colors dark:hover:bg-slate-700/80"
    >
      <div className={`${color} text-white p-1.5 rounded shrink-0`}>{icon}</div>
      <span className="text-sm text-gray-700 truncate dark:text-slate-200">{label}</span>
    </div>
  );
}
