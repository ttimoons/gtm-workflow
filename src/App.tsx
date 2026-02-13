import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { LoginPage } from './components/LoginPage';
import { useFlowStore } from './store/useFlowStore';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const loadLastProject = useFlowStore((s) => s.loadLastProject);
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLastProject();
    }
  }, [isAuthenticated, loadLastProject]);

  if (isLoading) return null;
  if (!isAuthenticated) return <LoginPage />;

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
