import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(username, password);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 w-full max-w-[380px] shadow-2xl">
        <h1 className="text-2xl font-semibold text-slate-200 mb-1">GTM Workflow</h1>
        <p className="text-sm text-slate-400 mb-7">Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-[15px] outline-none transition-colors focus:border-indigo-500 mb-4"
          />

          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-[15px] outline-none transition-colors focus:border-indigo-500 mb-4"
          />

          {error && (
            <p className="text-red-400 text-[13px] mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white rounded-lg text-[15px] font-medium transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
