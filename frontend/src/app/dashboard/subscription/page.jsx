'use client';
import { useEffect, useState } from 'react';
import {
  CreditCard, Check, AlertCircle, Loader2, MessageCircle, Clock,
  Palette, CalendarCheck, Users, BarChart3, Camera, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { formatDate, cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// ── Agrupación de permisos para mostrar al usuario ──────────────
// Cada grupo tiene un label amigable, un ícono, y los key_names que lo componen
const PERMISSION_GROUPS = [
  {
    id: 'builder',
    label: 'Creador de invitaciones',
    icon: Palette,
    keys: [
      'use_builder', 'builder_block_hero', 'builder_block_gallery',
      'builder_block_video', 'builder_block_music', 'builder_block_rsvp',
      'builder_block_map', 'builder_block_countdown', 'builder_block_schedule',
      'builder_block_couple', 'builder_block_gifts', 'builder_block_dresscode',
      'builder_block_photos', 'builder_block_text', 'builder_block_gif',
      'builder_block_misc',
    ],
  },
  {
    id: 'planner',
    label: 'Planificador de eventos',
    icon: CalendarCheck,
    keys: [
      'use_planner', 'planner_checklist', 'planner_budget',
      'planner_vendors', 'planner_timeline', 'planner_calendar',
      'planner_calendar_alerts', 'planner_seating', 'planner_seating_assign',
    ],
  },
  {
    id: 'guests',
    label: 'Gestión de invitados y RSVP',
    icon: Users,
    keys: ['view_guests', 'manage_guests'],
  },
  {
    id: 'photos',
    label: 'Fotos del evento',
    icon: Camera,
    keys: ['view_photos', 'delete_photos'],
  },
  {
    id: 'analytics',
    label: 'Analíticas y estadísticas',
    icon: BarChart3,
    keys: ['view_analytics'],
  },
];

/**
 * Dado un array de permisos del plan, retorna los grupos que aplican
 * con un indicador de si el grupo está completo o parcial.
 */
function getGroupedFeatures(permissions) {
  if (!permissions || permissions.length === 0) return [];

  const permKeys = new Set(permissions.map(p => p.key_name));
  const result = [];

  for (const group of PERMISSION_GROUPS) {
    const matchedKeys = group.keys.filter(k => permKeys.has(k));
    if (matchedKeys.length > 0) {
      const total = group.keys.length;
      const matched = matchedKeys.length;
      result.push({
        ...group,
        included: true,
        full: matched === total,
        count: matched,
        total,
      });
    }
  }

  return result;
}

function UsageMeter({ label, used, max }) {
  const isUnlimited = max === null;
  const pct = isUnlimited ? 0 : Math.min((used / max) * 100, 100);
  const isWarning = !isUnlimited && pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={isWarning ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
          {used} / {isUnlimited ? '∞' : max}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        {!isUnlimited ? (
          <div
            className={`h-full rounded-full transition-all ${isWarning ? 'bg-orange-500' : 'bg-violet-600'}`}
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="h-full bg-violet-200 rounded-full w-full" />
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesWa, setSalesWa] = useState('');

  const fetchData = async () => {
    try {
      const [subData, plansData, settingsData] = await Promise.all([
        dataCache.fetchers.subscription().catch(() => null),
        dataCache.fetchers.plans(),
        api.get('/settings').then(r => r.data.data).catch(() => ({})),
      ]);
      setSubscription(subData);
      setPlans(plansData);
      setSalesWa(settingsData.sales_whatsapp || '');
    } catch (err) {
      if (err.response?.status !== 404) {
        toast({ variant: 'destructive', title: 'Error al cargar suscripción' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRequestPlan = (plan) => {
    if (!salesWa) {
      toast({ variant: 'destructive', title: 'Sin número de ventas', description: 'Contacta al administrador de la plataforma.' });
      return;
    }
    const events = plan.max_events == null || plan.max_events === -1 ? 'ilimitados' : plan.max_events;
    const guests = plan.max_guests == null || plan.max_guests === -1 ? 'ilimitados' : plan.max_guests;
    const months = plan.duration_months ?? 1;
    const duration = months === 1 ? '1 mes' : months + ' meses';
    const lines = [
      'Hola, me interesa el plan *' + plan.name + '* de InvitApp.',
      '- Precio: $' + plan.price_usd + ' USD / Q' + plan.price_gtq + ' GTQ',
      '- Duración: ' + duration,
      '- Eventos: ' + events,
      '- Invitados: ' + guests,
      '',
      '¿Cómo puedo adquirirlo?',
    ];
    window.open('https://wa.me/' + salesWa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const isExpiringSoon = subscription &&
    new Date(subscription.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Suscripción</h1>
        <p className="text-gray-500 mt-1">Gestiona tu plan y consumo</p>
      </div>

      {/* Current plan */}
      {subscription ? (
        <Card className={`border-2 ${isExpiringSoon ? 'border-orange-300 bg-orange-50' : 'border-violet-200 bg-violet-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan actual</p>
                  <h2 className="text-2xl font-bold text-gray-900">{subscription.plan_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={subscription.status === 'active' ? 'success' : 'destructive'}>
                      {subscription.status === 'active' ? 'Activo' : subscription.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Vence: {formatDate(subscription.expires_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">${subscription.price_usd}</p>
                <p className="text-sm text-gray-500">
                  Q{subscription.price_gtq} GTQ / {(subscription.duration_months ?? 1) === 1 ? 'mes' : `${subscription.duration_months} meses`}
                </p>
              </div>
            </div>

            {isExpiringSoon && (
              <div className="mt-4 flex items-center gap-2 text-orange-700 bg-orange-100 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">Tu plan vence pronto. Renueva para no perder acceso.</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <UsageMeter label="Eventos" used={subscription.usage?.events?.used || 0} max={subscription.usage?.events?.max} />
              <UsageMeter label="Invitados" used={subscription.usage?.guests?.used || 0} max={subscription.usage?.guests?.max} />
              <UsageMeter label="Usuarios" used={subscription.usage?.users?.used || 0} max={subscription.usage?.users?.max} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">Sin suscripción activa</p>
              <p className="text-sm text-orange-700 mt-1">Selecciona un plan para comenzar a usar la plataforma</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {subscription ? 'Cambiar o ampliar plan' : 'Solicita un plan'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">Elige el plan que mejor se adapte a tus necesidades</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const isCurrent = subscription?.plan_name === plan.name;
            const isPopular = idx === 1 && plans.length > 1;
            const features = getGroupedFeatures(plan.permissions);

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col overflow-hidden transition-all hover:shadow-lg',
                  isCurrent && 'border-2 border-violet-500 shadow-md shadow-violet-100',
                  isPopular && !isCurrent && 'border-2 border-emerald-400 shadow-md shadow-emerald-50',
                  !isCurrent && !isPopular && 'border border-gray-200 hover:border-violet-300'
                )}
              >
                {/* Badge superior */}
                {(isCurrent || isPopular) && (
                  <div className={cn(
                    'absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-bold uppercase tracking-wide',
                    isCurrent ? 'bg-violet-600 text-white' : 'bg-emerald-500 text-white'
                  )}>
                    {isCurrent ? '✓ Tu plan actual' : '⭐ Popular'}
                  </div>
                )}

                <CardHeader className={cn('pb-2', (isCurrent || isPopular) && 'pt-10')}>
                  <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>

                  {/* Precio */}
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">${plan.price_usd}</span>
                      <span className="text-sm text-gray-500 font-medium">USD</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-semibold text-gray-600">Q{plan.price_gtq}</span>
                      <span className="text-xs text-gray-400">GTQ</span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-3 py-1">
                        <Clock className="w-3.5 h-3.5" />
                        {(plan.duration_months ?? 1) === 1 ? '1 mes' : `${plan.duration_months} meses`}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-2">
                  {/* Límites */}
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-violet-700" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>{(plan.max_events === -1 || plan.max_events == null) ? 'Ilimitados' : plan.max_events}</strong> eventos
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-violet-700" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>{(plan.max_guests === -1 || plan.max_guests == null) ? 'Ilimitados' : plan.max_guests}</strong> invitados
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-violet-700" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>{(plan.max_users === -1 || plan.max_users == null) ? 'Ilimitados' : plan.max_users}</strong> usuarios
                      </span>
                    </div>
                  </div>

                  {/* Funcionalidades agrupadas */}
                  {features.length > 0 && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Funcionalidades incluidas</p>
                      {features.map(group => {
                        const Icon = group.icon;
                        return (
                          <div key={group.id} className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-3 h-3 text-green-700" />
                            </div>
                            <span className="text-sm text-gray-700">{group.label}</span>
                            {!group.full && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">parcial</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Permisos no agrupados (si hay alguno fuera de los grupos) */}
                  {plan.permissions && (() => {
                    const groupedKeys = new Set(PERMISSION_GROUPS.flatMap(g => g.keys));
                    const ungrouped = plan.permissions.filter(p => !groupedKeys.has(p.key_name));
                    if (ungrouped.length === 0) return null;
                    return (
                      <div className="mt-2 space-y-1.5">
                        {ungrouped.map(p => (
                          <div key={p.id} className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-green-700" />
                            </div>
                            <span className="text-sm text-gray-700">{p.description || p.key_name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Spacer para empujar el botón al fondo */}
                  <div className="flex-1 min-h-4" />

                  {/* Botón */}
                  <Button
                    className={cn(
                      'w-full mt-4 gap-2 font-semibold',
                      isCurrent
                        ? 'border-violet-300 text-violet-700 hover:bg-violet-50'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                    )}
                    variant={isCurrent ? 'outline' : 'default'}
                    size="lg"
                    onClick={() => handleRequestPlan(plan)}
                    disabled={!salesWa}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isCurrent ? 'Solicitar cambio' : 'Solicitar plan'}
                  </Button>
                  {!salesWa && (
                    <p className="text-xs text-center text-red-400 mt-2">
                      ⚠ Contacta al administrador para activar solicitudes
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
