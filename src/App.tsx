import { useEffect, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { LoginPage } from './components/LoginPage';
import { useFlowStore } from './store/useFlowStore';
import { useAuthStore } from './store/useAuthStore';
import { applyTheme, getInitialTheme, type Theme } from './utils/theme';

export default function App() {
  const loadLastProject = useFlowStore((s) => s.loadLastProject);
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLastProject();
    }
  }, [isAuthenticated, loadLastProject]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  if (isLoading) return null;
  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100">
      <Toolbar theme={theme} onToggleTheme={toggleTheme} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1">
          <Canvas theme={theme} />
        </main>
      </div>
    </div>
  );
}
