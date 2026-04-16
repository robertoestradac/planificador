'use client';
import { useEffect, useState } from 'react';
import { ClipboardList, Plus, ChevronRight, Calendar, Loader2, Trash2 } from 'lucide-react';
import { GiDiamondRing, GiPartyPopper, GiBabyBottle, GiGraduateCap, GiStarMedal } from 'react-icons/gi';
import { MdCorporateFare, MdCake, MdChurch, MdEvent } from 'react-icons/md';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

const EVENT_TYPES = [
  { value: 'boda',        label: 'Boda',        Icon: GiDiamondRing,   color: 'text-pink-500',   bg: 'bg-pink-50'   },
  { value: 'xv_anos',     label: 'XV Anos',     Icon: GiStarMedal,     color: 'text-purple-500', bg: 'bg-purple-50' },
  { value: 'baby_shower', label: 'Baby Shower', Icon: GiBabyBottle,    color: 'text-sky-500',    bg: 'bg-sky-50'    },
  { value: 'graduacion',  label: 'Graduacion',  Icon: GiGraduateCap,   color: 'text-blue-500',   bg: 'bg-blue-50'   },
  { value: 'corporativo', label: 'Corporativo', Icon: MdCorporateFare, color: 'text-slate-500',  bg: 'bg-slate-50'  },
  { value: 'cumpleanos',  label: 'Cumpleanos',  Icon: MdCake,          color: 'text-orange-500', bg: 'bg-orange-50' },
  { value: 'bautizo',     label: 'Bautizo',     Icon: MdChurch,        color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { value: 'otro',        label: 'Otro',        Icon: MdEvent,         color: 'text-gray-500',   bg: 'bg-gray-50'   },
];

const typeMap = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t]));

export default function PlannerPage() {
  const [plans, setPlans]     = useState([]);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ event_id: '', event_type: 'boda', budget_total: '' });

  useEffect(() => {
    Promise.all([
      api.get('/planner').then(r => r.data.data),
      dataCache.fetchers.events(),
    ]).then(([plansData, eventsData]) => {
      setPlans(plansData);
      // Only show events that don't have a plan yet
      const plannedEventIds = new Set(plansData.map(p => p.event_id));
      setEvents(eventsData.filter(e => !plannedEventIds.has(e.id)));
    }).catch(() => toast({ variant: 'destructive', title: 'Error al cargar datos' }))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        event_id:     form.event_id,
        event_type:   form.event_type,
        budget_total: form.budget_total ? parseFloat(form.budget_total) : null,
      };
      const { data } = await api.post('/planner', payload);
      toast({ title: 'Plan creado', description: 'Las tareas se generaron automáticamente' });
      setPlans(prev => [data.data, ...prev]);
      setEvents(prev => prev.filter(ev => ev.id !== form.event_id));
      setShowForm(false);
      setForm({ event_id: '', event_type: 'boda', budget_total: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (planId, eventName) => {
    if (!confirm(`¿Eliminar el plan de "${eventName}"? Se perderán todas las tareas, presupuesto y proveedores.`)) return;
    try {
      await api.delete(`/planner/${planId}`);
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast({ title: 'Plan eliminado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planificador</h1>
          <p className="text-gray-500 mt-1">Organiza cada detalle de tus eventos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={events.length === 0 && !showForm}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo plan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Crear plan de evento</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Evento</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.event_id}
                  onChange={e => setForm({ ...form, event_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona un evento</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de evento</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.event_type}
                  onChange={e => setForm({ ...form, event_type: e.target.value })}
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Presupuesto total (opcional)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  value={form.budget_total}
                  onChange={e => setForm({ ...form, budget_total: e.target.value })}
                />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Crear plan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">Sin planes aún</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Crea un plan para organizar todos los detalles de tu evento</p>
            <Button onClick={() => setShowForm(true)} disabled={events.length === 0}>
              <Plus className="w-4 h-4 mr-2" /> Crear primer plan
            </Button>
            {events.length === 0 && (
              <p className="text-xs text-gray-400 mt-3">Primero crea un evento en la sección Eventos</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const type = typeMap[plan.event_type] || typeMap.otro;
            const pct  = plan.total_tasks > 0
              ? Math.round((plan.completed_tasks / plan.total_tasks) * 100)
              : 0;
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${type.bg}`}>
                        <type.Icon className={`w-5 h-5 ${type.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight">{plan.event_name}</h3>
                        <Badge variant="secondary" className="text-xs mt-0.5">{type.label}</Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(plan.id, plan.event_name)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {plan.event_date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(plan.event_date).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progreso</span>
                      <span className="font-medium">{pct}% ({plan.completed_tasks}/{plan.total_tasks})</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-violet-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {plan.budget_total && (
                    <p className="text-xs text-gray-400 mb-3">
                      Presupuesto: <span className="font-medium text-gray-600">Q{Number(plan.budget_total).toLocaleString()}</span>
                    </p>
                  )}

                  <Link href={`/dashboard/planner/${plan.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Abrir plan <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
