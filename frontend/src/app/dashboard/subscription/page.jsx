'use client';
import { useEffect, useState } from 'react';
import { CreditCard, Check, AlertCircle, RefreshCw, Loader2, MessageCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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
          <div className={`h-full rounded-full transition-all ${isWarning ? 'bg-orange-500' : 'bg-violet-600'}`}
            style={{ width: `${pct}%` }} />
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
      toast({ variant: 'destructive', title: 'Sin n\u00famero de ventas', description: 'Contacta al administrador de la plataforma.' });
      return;
    }
    const events   = plan.max_events == null || plan.max_events  === -1 ? 'ilimitados' : plan.max_events;
    const guests   = plan.max_guests == null || plan.max_guests  === -1 ? 'ilimitados' : plan.max_guests;
    const months   = plan.duration_months ?? 1;
    const duration = months === 1 ? '1 mes' : months + ' meses';
    const lines = [
      'Hola, me interesa el plan *' + plan.name + '* de InvitApp.',
      '- Precio: $' + plan.price_usd + ' USD / Q' + plan.price_gtq + ' GTQ',
      '- Duraci\u00f3n: ' + duration,
      '- Eventos: ' + events,
      '- Invitados: ' + guests,
      '',
      '\u00bfC\u00f3mo puedo adquirirlo?',
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
    <div className="space-y-8 max-w-4xl">
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {subscription ? 'Cambiar o ampliar plan' : 'Solicita un plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const isCurrent = subscription?.plan_name === plan.name;
            return (
              <Card key={plan.id} className={`relative ${isCurrent ? 'border-violet-400 shadow-md' : ''}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white">Plan actual</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-gray-900">${plan.price_usd}</span>
                    <span className="text-sm text-gray-500"> USD</span>
                    <br />
                    <span className="text-lg font-semibold text-gray-600">Q{plan.price_gtq}</span>
                    <span className="text-sm text-gray-500"> GTQ</span>
                    <br />
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-0.5">
                      <Clock className="w-3 h-3" />
                      {(plan.duration_months ?? 1) === 1 ? '1 mes de acceso' : `${plan.duration_months} meses de acceso`}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Eventos', value: (plan.max_events === -1 || plan.max_events == null) ? 'Ilimitados' : plan.max_events },
                    { label: 'Invitados', value: (plan.max_guests === -1 || plan.max_guests == null) ? 'Ilimitados' : plan.max_guests },
                    { label: 'Usuarios', value: (plan.max_users === -1 || plan.max_users == null) ? 'Ilimitados' : plan.max_users },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{value} {label}</span>
                    </div>
                  ))}

                  {plan.permissions && plan.permissions.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-2 pt-2" />
                      {plan.permissions.map(p => (
                        <div key={p.id} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-xs">{p.description || p.key_name}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <Button
                    className={cn('w-full mt-4 gap-2', !isCurrent && 'bg-green-600 hover:bg-green-700 text-white')}
                    variant={isCurrent ? 'outline' : 'default'}
                    onClick={() => handleRequestPlan(plan)}
                    disabled={!salesWa}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isCurrent ? 'Solicitar cambio' : 'Solicitar plan'}
                  </Button>
                  {!salesWa && (
                    <p className="text-xs text-center text-gray-400 mt-1">Contacta al administrador</p>
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
