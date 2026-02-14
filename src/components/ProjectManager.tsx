import { X, Trash2, FolderOpen } from 'lucide-react';
import { getAllProjects, deleteProject } from '../utils/storage';
import { useFlowStore } from '../store/useFlowStore';
import { useState, useEffect } from 'react';
import type { Project } from '../store/types';

type ProjectManagerProps = {
  onClose: () => void;
};

export function ProjectManager({ onClose }: ProjectManagerProps) {
  const importProject = useFlowStore((s) => s.importProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const all = await getAllProjects();
    setProjects(all);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleLoad = (project: Project) => {
    importProject(JSON.stringify(project));
    onClose();
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
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
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {project.name}
                    </h3>
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
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 rounded-md hover:bg-red-100 text-red-500"
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
