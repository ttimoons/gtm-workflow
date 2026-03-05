import { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  FilePlus,
  LayoutTemplate,
  FolderOpen,
  LogOut,
  Undo2,
  Redo2,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  GripHorizontal,
  GripVertical,
  Globe,
  Image,
  Moon,
  Sun,
} from 'lucide-react';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import { downloadProjectJson } from '../utils/storage';
import { exportCanvasAsPng } from '../utils/exportPng';
import { TemplateModal } from './TemplateModal';
import { ProjectManager } from './ProjectManager';
import { DomainScannerModal } from './DomainScannerModal';
import type { Theme } from '../utils/theme';

type ToolbarProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

export function Toolbar({ theme, onToggleTheme }: ToolbarProps) {
  const { projectName, projectId, nodes, edges, setProjectName, newProject, saveCurrentProject, importProject } =
    useFlowStore();
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const past = useFlowStore((s) => s.past);
  const future = useFlowStore((s) => s.future);
  const alignSelected = useFlowStore((s) => s.alignSelected);
  const distributeSelected = useFlowStore((s) => s.distributeSelected);
  const selectedCount = useFlowStore((s) => s.nodes.filter((n) => n.selected).length);
  const logout = useAuthStore((s) => s.logout);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showDomainScanner, setShowDomainScanner] = useState(false);

  const handleExport = () => {
    downloadProjectJson({ id: projectId, name: projectName, nodes, edges });
  };

  const handleExportPng = () => {
    const slug = projectName.replace(/\s+/g, '-').toLowerCase();
    exportCanvasAsPng(slug, nodes);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => importProject(reader.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <>
      <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between shrink-0 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <LayoutTemplate size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500 hidden sm:inline dark:text-slate-300">GTM Workflow</span>
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-base font-semibold bg-transparent border-none focus:outline-none focus:ring-2
                       focus:ring-blue-300 rounded px-2 py-1 text-gray-900 min-w-0 dark:text-slate-100 dark:focus:ring-blue-500"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-800 dark:text-slate-300"
            title="Undo (⌘Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-800 dark:text-slate-300"
            title="Redo (⌘⇧Z)"
          >
            <Redo2 size={14} />
          </button>
          {selectedCount >= 2 && (
            <>
              <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
              <div className="flex items-center gap-0.5 bg-gray-50 rounded-md px-1 py-0.5 dark:bg-slate-800">
                <button
                  onClick={() => alignSelected('left')}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  title="Align left"
                >
                  <AlignStartVertical size={14} />
                </button>
                <button
                  onClick={() => alignSelected('center-x')}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  title="Align center"
                >
                  <AlignCenterVertical size={14} />
                </button>
                <button
                  onClick={() => alignSelected('right')}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  title="Align right"
                >
                  <AlignEndVertical size={14} />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5 dark:bg-slate-600" />
                <button
                  onClick={() => alignSelected('top')}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  title="Align top"
                >
                  <AlignStartHorizontal size={14} />
                </button>
                <button
                  onClick={() => alignSelected('center-y')}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  title="Align middle"
                >
                  <AlignCenterHorizontal size={14} />
                </button>
                <button
                  onClick={() => alignSelected('bottom')}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  title="Align bottom"
                >
                  <AlignEndHorizontal size={14} />
                </button>
                {selectedCount >= 3 && (
                  <>
                    <div className="w-px h-4 bg-gray-300 mx-0.5 dark:bg-slate-600" />
                    <button
                      onClick={() => distributeSelected('horizontal')}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                      title="Distribute horizontally"
                    >
                      <GripHorizontal size={14} />
                    </button>
                    <button
                      onClick={() => distributeSelected('vertical')}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                      title="Distribute vertically"
                    >
                      <GripVertical size={14} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button
            onClick={() => setShowDomainScanner(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title="Scan website for tags"
          >
            <Globe size={14} />
            <span className="hidden sm:inline">Scan Domain</span>
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
          >
            <LayoutTemplate size={14} />
            <span className="hidden sm:inline">Templates</span>
          </button>
          <button
            onClick={() => setShowProjects(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title="Open saved project"
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={newProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title="New project"
          >
            <FilePlus size={14} />
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button
            onClick={saveCurrentProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title="Save project"
          >
            <Save size={14} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title="Export JSON"
          >
            <Download size={14} />
          </button>
          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title="Export as PNG"
          >
            <Image size={14} />
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
            title="Import JSON"
          >
            <Upload size={14} />
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors dark:text-slate-300 dark:hover:bg-red-500/15 dark:hover:text-red-300"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {showTemplates && <TemplateModal onClose={() => setShowTemplates(false)} />}
      {showProjects && <ProjectManager onClose={() => setShowProjects(false)} />}
      {showDomainScanner && <DomainScannerModal onClose={() => setShowDomainScanner(false)} />}
    </>
  );
}
