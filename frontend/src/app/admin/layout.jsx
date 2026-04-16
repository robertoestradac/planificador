'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Menu } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import useAuthStore from '@/store/authStore';
import AppBranding from '@/components/layout/AppBranding';

const PAGE_TITLES = {
  '/admin':              'Dashboard',
  '/admin/tenants':      'Tenants',
  '/admin/users':        'Usuarios',
  '/admin/roles':        'Roles',
  '/admin/plans':        'Planes',
  '/admin/permissions':  'Permisos',
  '/admin/templates':    'Plantillas',
  '/admin/analytics':    'Estadísticas',
  '/admin/whatsapp':     'WhatsApp Business Marketing',
  '/email':              'Email Marketing Suite',
  '/admin/marketing':    'Marketing & Comunicaciones',
  '/admin/landing':      'Landing Page',
  '/admin/settings':     'Configuración',
};

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    const adminRoles = ['SuperAdmin', 'Admin', 'Support'];
    if (user && !adminRoles.includes(user.role)) router.push('/dashboard');
  }, [_hasHydrated, isAuthenticated, user, router]);

  // Close drawer on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    key === pathname || (key !== '/admin' && pathname.startsWith(key))
  )?.[1] || 'Admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Mobile top bar ── */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <AppBranding size="sm" />
          <span className="ml-auto text-sm font-semibold text-gray-500">{pageTitle}</span>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
