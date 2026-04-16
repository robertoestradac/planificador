'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Mail, Users, CreditCard,
  ChevronRight, BarChart3, Camera, ClipboardList, X, LayoutTemplate, ShieldAlert, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import AlertBadge from '@/components/layout/AlertBadge';
import AppBranding from '@/components/layout/AppBranding';

const navItems = [
  { label: 'Dashboard',      href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Eventos',        href: '/dashboard/events',       icon: Calendar },
  { label: 'Planificador',   href: '/dashboard/planner',      icon: ClipboardList },
  { label: 'Plantillas',     href: '/dashboard/templates',    icon: LayoutTemplate },
  { label: 'Invitaciones',   href: '/dashboard/invitations',  icon: Mail },
  { label: 'Invitados',      href: '/dashboard/guests',       icon: Users },
  { label: 'Fotos',          href: '/dashboard/photos',       icon: Camera },
  { label: 'Analíticas',     href: '/dashboard/analytics',    icon: BarChart3 },
  { label: 'Mi Plan',        href: '/dashboard/subscription', icon: CreditCard },
  { label: 'Facturación',    href: '/dashboard/billing',      icon: DollarSign },
  { label: 'Equipo',         href: '/dashboard/team',         icon: Users },
  { label: 'Seguridad',      href: '/dashboard/settings',     icon: ShieldAlert },
];

export default function ClientSidebar({ onClose }) {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hasHydrated  = useAuthStore((s) => s._hasHydrated);

  const handleHover = (href) => {
    if (!_hasHydrated || !isAuthenticated) return;
    import('@/lib/dataCache').then(({ prefetchRoute }) => prefetchRoute(href));
  };

  return (
    <aside className="w-64 h-full min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <AppBranding />
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          const isPlanner = href === '/dashboard/planner';
          const linkEl = (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => handleHover(href)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-violet-50 text-violet-700 border border-violet-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-violet-600' : 'text-gray-400')} />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />}
            </Link>
          );
          if (isPlanner) {
            return (
              <div key={href} className="relative">
                {linkEl}
                <AlertBadge />
              </div>
            );
          }
          return linkEl;
        })}
      </nav>
    </aside>
  );
}
