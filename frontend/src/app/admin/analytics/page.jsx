'use client';
import { useEffect, useState } from 'react';
import { Building2, Users, Mail, Eye, TrendingUp, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@/lib/api';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/global')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas Globales</h1>
        <p className="text-gray-500 mt-1">Métricas de toda la plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Tenants Activos"   value={stats?.tenants}       icon={Building2}   color="bg-violet-600" />
        <StatCard title="Usuarios Totales"  value={stats?.users}         icon={Users}       color="bg-blue-600" />
        <StatCard title="Eventos Creados"   value={stats?.events}        icon={CreditCard}  color="bg-green-600" />
        <StatCard title="Invitaciones"      value={stats?.invitations}   icon={Mail}        color="bg-orange-600" />
        <StatCard title="Vistas Totales"    value={stats?.total_views}   icon={Eye}         color="bg-pink-600" />
        <StatCard title="Invitados Totales" value={stats?.total_guests}  icon={Users}       color="bg-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New tenants trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              Nuevos Tenants — últimos 30 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats?.new_tenants_trend || []}>
                <defs>
                  <linearGradient id="gradTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="url(#gradTenants)" strokeWidth={2} name="Tenants" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-600" />
              Distribución por Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.plan_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats.plan_distribution}
                    dataKey="count"
                    nameKey="plan_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ plan_name, percent }) => `${plan_name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.plan_distribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
                Sin datos de suscripciones activas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar chart: plan distribution */}
      {stats?.plan_distribution?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenants por Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.plan_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="plan_name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Tenants" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
