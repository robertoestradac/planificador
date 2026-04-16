'use client';
import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, Calendar, Users, FileText, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import api from '@/lib/api';

const STATUS_LABEL   = { pending: 'Pendiente', confirmed: 'Confirmado', rejected: 'Rechazado' };
const STATUS_VARIANT = { pending: 'warning', confirmed: 'success', rejected: 'destructive' };
const STATUS_ICON    = { pending: Clock, confirmed: CheckCircle, rejected: XCircle };

export default function BillingPage() {
  const [credits, setCredits]   = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [creditsRes, paymentsRes] = await Promise.all([
          api.get('/payments/my/credits'),
          api.get('/payments/my?limit=50'),
        ]);
        setCredits(creditsRes.data.data);
        setPayments(paymentsRes.data.data?.data || []);
      } catch {} finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const CreditBar = ({ label, icon: Icon, used, total, color }) => {
    const pct = total === null ? 0 : total === 0 ? 100 : Math.min(100, (used / total) * 100);
    const available = total === null ? '∞' : Math.max(0, total - used);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
            <Icon className="w-4 h-4 text-gray-400" /> {label}
          </div>
          <span className="text-gray-500 text-xs">
            {used} usados · <span className={cn('font-semibold', total === null ? 'text-green-600' : available > 0 ? 'text-violet-600' : 'text-red-500')}>
              {available} disponibles
            </span>
          </span>
        </div>
        {total !== null && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
          </div>
        )}
        {total === null && (
          <div className="h-2 bg-gradient-to-r from-violet-300 to-violet-500 rounded-full" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturación y Plan</h1>
        <p className="text-gray-500 mt-1">Tu saldo de créditos y el historial de pagos</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Credits */}
          {credits ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-600" />
                  <h2 className="font-bold text-gray-900">Créditos disponibles</h2>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Basado en todos tus planes confirmados</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <CreditBar label="Eventos"       icon={Calendar} used={credits.events.used}      total={credits.events.total}      color="bg-violet-500" />
                <CreditBar label="Invitaciones"  icon={FileText}  used={credits.invitations.used} total={credits.invitations.total} color="bg-pink-500" />
                <CreditBar label="Invitados"     icon={Users}     used={credits.guests.used}      total={credits.guests.total}      color="bg-blue-500" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">Sin plan activo</p>
                <p className="text-sm text-gray-400 mt-1">Contacta al administrador para adquirir un plan</p>
              </CardContent>
            </Card>
          )}

          {/* Payment history */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <h2 className="font-bold text-gray-900">Historial de pagos</h2>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No hay pagos registrados</p>
              ) : (
                <div className="space-y-3">
                  {payments.map(p => {
                    const Icon = STATUS_ICON[p.status] || Clock;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                            p.status === 'confirmed' ? 'bg-green-100' : p.status === 'rejected' ? 'bg-red-100' : 'bg-amber-100')}>
                            <Icon className={cn('w-4 h-4',
                              p.status === 'confirmed' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-500' : 'text-amber-600')} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{p.plan_name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                              <span>{formatDate(p.created_at)}</span>
                              {p.reference && <span className="font-mono">· Ref: {p.reference}</span>}
                              <span>· {p.method === 'bank_transfer' ? 'Depósito' : 'Link'}</span>
                            </div>
                            {p.status === 'confirmed' && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {p.max_events != null ? `${p.max_events} eventos` : '∞ eventos'} ·{' '}
                                {p.max_guests != null ? `${p.max_guests} invitados` : '∞ invitados'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="font-bold text-gray-900">${Number(p.amount).toFixed(2)}</p>
                          <Badge variant={STATUS_VARIANT[p.status]} className="text-xs mt-1">
                            {STATUS_LABEL[p.status]}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
