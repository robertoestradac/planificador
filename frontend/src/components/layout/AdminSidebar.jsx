'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, CreditCard, Shield,
  FileImage, BarChart3, LogOut, ChevronRight, Settings, Monitor, X, Megaphone, MessageSquare, Mail, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';
import AppBranding from '@/components/layout/AppBranding';

const navItems = [
  { label: 'Dashboard',    href: '/admin',              icon: LayoutDashboard },
  { label: 'Tenants',      href: '/admin/tenants',      icon: Building2 },
  { label: 'Usuarios',     href: '/admin/users',        icon: Users },
  { label: 'Roles',        href: '/admin/roles',        icon: Shield },
  { label: 'Planes',       href: '/admin/plans',        icon: CreditCard },
  { label: 'Permisos',     href: '/admin/permissions',  icon: Shield },
  { label: 'Plantillas',   href: '/admin/templates',    icon: FileImage },
  { label: 'Estadísticas', href: '/admin/analytics',    icon: BarChart3 },
  { label: 'Pagos',         href: '/admin/payments',     icon: DollarSign },
  { label: 'WhatsApp',     href: '/wa',                 icon: MessageSquare, external: true },
  { label: 'Email',        href: '/email',              icon: Mail,          external: true },
  { label: 'Landing Page',  href: '/admin/landing',      icon: Monitor },
  { label: 'Configuración',href: '/admin/settings',     icon: Settings },
];

function SidebarContent({ onClose }) {
  const pathname = usePathname();
  const logout   = useAuthStore((s) => s.logout);
  const user     = useAuthStore((s) => s.user);
  const router   = useRouter();

  const handleLogout = async () => {
    const { default: dataCache } = await import('@/lib/dataCache');
    dataCache.clear();
    await logout();
    router.push('/adminsis');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <AppBranding dark />
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, external }) => {
          const active = !external && (pathname === href || (href !== '/admin' && pathname.startsWith(href)));
          const cls = cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full',
            active
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          );
          if (external) {
            return (
              <button
                key={href}
                onClick={() => { window.open(href, '_blank', 'noopener,noreferrer'); if (onClose) onClose(); }}
                className={cls}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              className={cls}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* ── DESKTOP: static sidebar ── */}
      <aside className="hidden lg:flex w-64 min-h-screen flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── MOBILE: drawer overlay ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <aside
            className="relative w-72 max-w-[85vw] h-full shadow-2xl"
            style={{ animation: 'slideInLeft 0.22s ease-out' }}
          >
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </>
  );
}
