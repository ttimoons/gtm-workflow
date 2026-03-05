import { X } from 'lucide-react';
import { templates } from '../data/templates';
import { useFlowStore } from '../store/useFlowStore';

type TemplateModalProps = {
  onClose: () => void;
};

export function TemplateModal({ onClose }: TemplateModalProps) {
  const loadFromTemplate = useFlowStore((s) => s.loadFromTemplate);

  const handleSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      loadFromTemplate(template.nodes, template.edges, template.name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col dark:bg-slate-800 dark:border dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Project Templates</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template.id)}
                className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-400
                           hover:bg-blue-50/50 transition-colors cursor-pointer dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
              >
                <h3 className="font-medium text-gray-900 mb-1 dark:text-slate-100">{template.name}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{template.description}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-300">
                    {template.nodes.length} nodes
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-300">
                    {template.edges.length} connections
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
