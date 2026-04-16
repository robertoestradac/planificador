'use client';
import { useEffect, useState } from 'react';
import { Building2, Users, Mail, Eye, CreditCard, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import api from '@/lib/api';

const STAT_CONFIG = [
  { key: 'tenants',      title: 'Tenants Activos', icon: Building2,   color: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-600' },
  { key: 'users',        title: 'Usuarios',        icon: Users,       color: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-600'   },
  { key: 'events',       title: 'Eventos',         icon: CreditCard,  color: 'bg-green-600',  light: 'bg-green-50',  text: 'text-green-600'  },
  { key: 'invitations',  title: 'Invitaciones',    icon: Mail,        color: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-600' },
  { key: 'total_views',  title: 'Vistas Totales',  icon: Eye,         color: 'bg-pink-600',   light: 'bg-pink-50',   text: 'text-pink-600'   },
  { key: 'total_guests', title: 'Invitados',       icon: TrendingUp,  color: 'bg-teal-600',   light: 'bg-teal-50',   text: 'text-teal-600'   },
];

function StatCard({ title, value, icon: Icon, color, light, text }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 tabular-nums">
              {value != null ? value.toLocaleString() : '—'}
            </p>
          </div>
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${light}`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
            <div className="h-7 bg-gray-200 rounded animate-pulse w-16" />
          </div>
          <div className="w-11 h-11 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/global')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Global</h1>
        <p className="text-sm text-gray-500 mt-1">Estadísticas generales de la plataforma</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {loading
          ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          : STAT_CONFIG.map(({ key, ...cfg }) => (
              <StatCard key={key} value={stats?.[key]} {...cfg} />
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Nuevos Tenants (30 días)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats?.new_tenants_trend || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="url(#colorTenants)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Distribución por Plan</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats?.plan_distribution || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="plan_name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
