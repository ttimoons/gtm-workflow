import { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  FilePlus,
  LayoutTemplate,
  FolderOpen,
  LogOut,
} from 'lucide-react';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import { downloadProjectJson } from '../utils/storage';
import { TemplateModal } from './TemplateModal';
import { ProjectManager } from './ProjectManager';

export function Toolbar() {
  const { projectName, projectId, nodes, edges, setProjectName, newProject, saveCurrentProject, importProject } =
    useFlowStore();
  const logout = useAuthStore((s) => s.logout);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

  const handleExport = () => {
    downloadProjectJson({ id: projectId, name: projectName, nodes, edges });
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
      <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <LayoutTemplate size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500 hidden sm:inline">GTM Workflow</span>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-base font-semibold bg-transparent border-none focus:outline-none focus:ring-2
                       focus:ring-blue-300 rounded px-2 py-1 text-gray-900 min-w-0"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-1.5">
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
                       hover:bg-gray-100 text-gray-600 transition-colors"
            title="Open saved project"
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={newProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors"
            title="New project"
          >
            <FilePlus size={14} />
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={saveCurrentProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors"
            title="Save project"
          >
            <Save size={14} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors"
            title="Export JSON"
          >
            <Download size={14} />
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-gray-100 text-gray-600 transition-colors"
            title="Import JSON"
          >
            <Upload size={14} />
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
                       hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {showTemplates && <TemplateModal onClose={() => setShowTemplates(false)} />}
      {showProjects && <ProjectManager onClose={() => setShowProjects(false)} />}
    </>
  );
}
