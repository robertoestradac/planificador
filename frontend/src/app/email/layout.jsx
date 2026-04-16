'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldX } from 'lucide-react';
import useAuthStore from '@/store/authStore';

const ALLOWED_ROLES = ['SuperAdmin', 'Admin', 'Support'];

export default function EmailLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.replace('/login?redirect=/email');
  }, [_hasHydrated, isAuthenticated, router]);

  if (!_hasHydrated) return (
    <div className="flex items-center justify-center min-h-screen bg-[#1e1b4b]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
      </div>
    </div>
  );

  if (!isAuthenticated) return null;

  if (!ALLOWED_ROLES.includes(user?.role)) return (
    <div className="flex items-center justify-center min-h-screen bg-[#1e1b4b]">
      <div className="text-center space-y-4">
        <ShieldX className="w-16 h-16 text-red-400 mx-auto" />
        <h1 className="text-white text-xl font-bold">Acceso no autorizado</h1>
        <p className="text-indigo-300 text-sm">No tienes permisos para acceder a Email Marketing.</p>
        <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold">
          Cerrar ventana
        </button>
      </div>
    </div>
  );

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
