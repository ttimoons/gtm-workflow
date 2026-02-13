import { X, Trash2, FolderOpen, HardDrive, Globe } from 'lucide-react';
import { getAllProjects, deleteProject, loadFileProjects } from '../utils/storage';
import { useFlowStore } from '../store/useFlowStore';
import { useState, useEffect } from 'react';
import type { Project } from '../store/types';

type ProjectManagerProps = {
  onClose: () => void;
};

export function ProjectManager({ onClose }: ProjectManagerProps) {
  const loadProjectById = useFlowStore((s) => s.loadProjectById);
  const importProject = useFlowStore((s) => s.importProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fileProjectIds, setFileProjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [all, fileProjects] = await Promise.all([
      getAllProjects(),
      loadFileProjects(),
    ]);
    setFileProjectIds(new Set(fileProjects.map((p) => p.id)));
    setProjects(all);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleLoad = (project: Project) => {
    if (fileProjectIds.has(project.id)) {
      // File-based project: import it into the store directly
      importProject(JSON.stringify(project));
    } else {
      loadProjectById(project.id);
    }
    onClose();
  };

  const handleDelete = async (id: string) => {
    deleteProject(id);
    await loadAll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Saved Projects</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No saved projects yet. Create one and it will auto-save.
            </p>
          ) : (
            <div className="grid gap-2">
              {projects.map((project) => {
                const isFile = fileProjectIds.has(project.id);
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {project.name}
                        </h3>
                        {isFile ? (
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600" title="Synced via git (public/projects/)">
                            <Globe size={10} />
                            git
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" title="Stored in browser localStorage">
                            <HardDrive size={10} />
                            local
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {project.nodes.length} nodes &middot;{' '}
                        {project.updatedAt
                          ? new Date(project.updatedAt).toLocaleDateString()
                          : 'unknown date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleLoad(project)}
                        className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600"
                        title="Open project"
                      >
                        <FolderOpen size={16} />
                      </button>
                      {!isFile && (
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-1.5 rounded-md hover:bg-red-100 text-red-500"
                          title="Delete project"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
