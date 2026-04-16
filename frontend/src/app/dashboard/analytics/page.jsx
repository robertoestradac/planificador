'use client';
import { useEffect, useState } from 'react';
import { Eye, Users, Mail, Calendar, Loader2 } from 'lucide-react';
import NoPlanBanner from '@/components/ui/no-plan-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import dataCache from '@/lib/dataCache';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientAnalyticsPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [noPlan, setNoPlan]   = useState(false);

  useEffect(() => {
    dataCache.fetchers.dashboard()
      .then(data => setStats(data))
      .catch(err => { if (err.response?.status === 403) setNoPlan(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (noPlan) return <NoPlanBanner description="Tu plan no tiene permiso para usar este módulo o aún no cuentas con un plan activo. Elige un plan para ver analíticas." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analíticas</h1>
        <p className="text-gray-500 mt-1">Estadísticas de tus invitaciones y eventos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Eventos"              value={stats?.events}               icon={Calendar} color="bg-blue-600" />
        <StatCard title="Invitaciones"         value={stats?.invitations}          icon={Mail}     color="bg-violet-600" />
        <StatCard title="Publicadas"           value={stats?.published_invitations} icon={Mail}    color="bg-green-600" />
        <StatCard title="Vistas Totales"       value={stats?.total_views}          icon={Eye}      color="bg-pink-600" />
        <StatCard title="Invitados"            value={stats?.total_guests}         icon={Users}    color="bg-teal-600" />
        <StatCard title="Confirmados"          value={stats?.confirmed_guests}     icon={Users}    color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vistas por día — últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats?.views_trend || []}>
                <defs>
                  <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#7c3aed" fill="url(#gradViews)" strokeWidth={2} name="Vistas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de confirmaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { name: 'Confirmados', value: stats?.confirmed_guests || 0 },
                { name: 'Pendientes',  value: (stats?.total_guests || 0) - (stats?.confirmed_guests || 0) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}
                  fill="#7c3aed"
                  label={{ position: 'top', fontSize: 12 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {stats?.total_guests > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasa de confirmación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-5xl font-bold text-violet-600">
                {Math.round(((stats?.confirmed_guests || 0) / stats.total_guests) * 100)}%
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all"
                    style={{ width: `${Math.round(((stats?.confirmed_guests || 0) / stats.total_guests) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.confirmed_guests} de {stats.total_guests} invitados confirmaron asistencia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
