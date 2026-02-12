import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { useFlowStore } from './store/useFlowStore';

export default function App() {
  const loadLastProject = useFlowStore((s) => s.loadLastProject);

  useEffect(() => {
    loadLastProject();
  }, [loadLastProject]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1">
          <Canvas />
        </main>
      </div>
    </div>
  );
}
