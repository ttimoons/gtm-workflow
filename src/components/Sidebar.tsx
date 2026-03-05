import {
  Globe,
  Container,
  Server,
  ArrowRightLeft,
  Square,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { getAllTagTypes } from '../data/tagRegistry';

export function Sidebar() {
  const tagTypes = getAllTagTypes();

  const version = __APP_VERSION__;

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto flex flex-col gap-1 shrink-0 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1 dark:text-slate-400">
        Infrastructure
      </h2>
      <SidebarItem
        nodeType="website"
        label="Website / Data Layer"
        icon={<Globe size={14} />}
        color="bg-emerald-600"
      />
      <SidebarItem
        nodeType="gtmClient"
        label="GTM Client Container"
        icon={<Container size={14} />}
        color="bg-blue-600"
        data={{ containerType: 'client' }}
      />
      <SidebarItem
        nodeType="gtmServer"
        label="GTM Server Container"
        icon={<Server size={14} />}
        color="bg-indigo-700"
        data={{ containerType: 'server' }}
      />
      <SidebarItem
        nodeType="dataStream"
        label="Data Stream"
        icon={<ArrowRightLeft size={14} />}
        color="bg-cyan-500"
      />

      <h2 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mt-4 mb-1 dark:text-slate-400">
        Tags
      </h2>
      {tagTypes.map(({ type, config }) => (
        <SidebarItem
          key={type}
          nodeType="tag"
          label={config.label}
          icon={config.icon}
          color={config.color}
          data={{ tagType: type }}
        />
      ))}

      <h2 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mt-4 mb-1 dark:text-slate-400">
        Annotation
      </h2>
      <SidebarItem
        nodeType="zone"
        label="Zone Box"
        icon={<Square size={14} />}
        color="bg-blue-500"
        data={{ color: '#3b82f6' }}
      />

      <div className="mt-auto pt-4 border-t border-gray-200 text-center dark:border-slate-700">
        <span className="text-[10px] text-gray-400 dark:text-slate-500">GTM Workflow v{version}</span>
      </div>
    </aside>
  );
}
