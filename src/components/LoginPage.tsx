import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const { signIn, error } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 w-full max-w-[380px] shadow-2xl">
        <h1 className="text-2xl font-semibold text-slate-200 mb-1">GTM Workflow</h1>
        <p className="text-sm text-slate-400 mb-7">Sign in to continue</p>

        {error && (
          <p className="text-red-400 text-[13px] mb-4">{error}</p>
        )}

        <button
          type="button"
          onClick={signIn}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[15px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-3 border border-slate-300"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
