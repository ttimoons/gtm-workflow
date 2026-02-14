import { ShieldAlert, EyeOff, Monitor } from 'lucide-react';
import type { ExposureFlag } from '../store/types';

const EXPOSURE_OPTIONS: { flag: ExposureFlag; label: string; shortLabel: string; icon: React.ReactNode; colors: string }[] = [
  { flag: 'itp', label: 'ITP / Cookie restrictions', shortLabel: 'ITP', icon: <ShieldAlert size={10} />, colors: 'bg-amber-100 text-amber-700 border-amber-300' },
  { flag: 'ad-blocker', label: 'Ad blocker exposed', shortLabel: 'Ad Block', icon: <EyeOff size={10} />, colors: 'bg-red-100 text-red-700 border-red-300' },
  { flag: 'client-side', label: 'Client-side only', shortLabel: 'Client', icon: <Monitor size={10} />, colors: 'bg-orange-100 text-orange-700 border-orange-300' },
];

type ExposureBadgesProps = {
  nodeId: string;
  exposure?: ExposureFlag[];
  onToggle: (nodeId: string, flag: ExposureFlag) => void;
};

export function ExposureBadges({ nodeId, exposure = [], onToggle }: ExposureBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {EXPOSURE_OPTIONS.map(({ flag, label, shortLabel, icon, colors }) => {
        const active = exposure.includes(flag);
        return (
          <button
            key={flag}
            type="button"
            title={label}
            onClick={(e) => { e.stopPropagation(); onToggle(nodeId, flag); }}
            className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border transition-all cursor-pointer
              ${active
                ? colors
                : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50 hover:opacity-80'
              }`}
          >
            {icon}
            {shortLabel}
          </button>
        );
      })}
    </div>
  );
}
