'use client';
import { useEffect, useState } from 'react';
import { Calendar, Mail, Eye, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NoPlanBanner from '@/components/ui/no-plan-banner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageMeter({ label, used, max }) {
  const pct = max ? Math.min((used / max) * 100, 100) : 0;
  const isUnlimited = max === null;
  const isWarning = !isUnlimited && pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={isWarning ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
          {used} / {isUnlimited ? '∞' : max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {!isUnlimited && (
          <div
            className={`h-full rounded-full transition-all ${isWarning ? 'bg-orange-500' : 'bg-violet-600'}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {isUnlimited && <div className="h-full bg-violet-200 rounded-full w-full" />}
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats]               = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noPlan, setNoPlan]   = useState(false);

  useEffect(() => {
    Promise.all([
      dataCache.fetchers.dashboard(),
      dataCache.fetchers.subscription(),
    ]).then(([statsData, subData]) => {
      if (!statsData) { setNoPlan(true); return; }
      setStats(statsData);
      setSubscription(subData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-6 h-28 animate-pulse bg-gray-100 rounded-lg" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (noPlan) return <NoPlanBanner />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 mt-1">Aquí tienes un resumen de tu actividad</p>
        </div>
        <Link href="/dashboard/invitations/new">
          <Button><Mail className="w-4 h-4 mr-2" /> Nueva Invitación</Button>
        </Link>
      </div>

      {/* Subscription alert */}
      {subscription && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-violet-900">Plan {subscription.plan_name}</p>
                <p className="text-xs text-violet-700">
                  Vence: {new Date(subscription.expires_at).toLocaleDateString('es-GT')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="success">Activo</Badge>
              <Link href="/dashboard/subscription">
                <Button size="sm" variant="outline">Ver plan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Eventos" value={stats?.events} icon={Calendar} color="bg-blue-600" />
        <StatCard title="Invitaciones" value={stats?.invitations} icon={Mail} color="bg-violet-600"
          subtitle={`${stats?.published_invitations || 0} publicadas`} />
        <StatCard title="Vistas Totales" value={stats?.total_views} icon={Eye} color="bg-pink-600" />
        <StatCard title="Invitados" value={stats?.total_guests} icon={Users} color="bg-teal-600" />
        <StatCard title="Confirmados" value={stats?.confirmed_guests} icon={Users} color="bg-green-600"
          subtitle={stats?.total_guests ? `${Math.round((stats.confirmed_guests / stats.total_guests) * 100)}% de asistencia` : ''} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vistas de invitaciones (30 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.views_trend || []}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" stroke="#7c3aed" fill="url(#colorViews)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uso del plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageMeter
                label="Eventos"
                used={subscription.usage?.events?.used || 0}
                max={subscription.usage?.events?.max}
              />
              <UsageMeter
                label="Invitados"
                used={subscription.usage?.guests?.used || 0}
                max={subscription.usage?.guests?.max}
              />
              <UsageMeter
                label="Usuarios"
                used={subscription.usage?.users?.used || 0}
                max={subscription.usage?.users?.max}
              />
              <Link href="/dashboard/subscription">
                <Button variant="outline" size="sm" className="w-full mt-2">Gestionar plan</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
