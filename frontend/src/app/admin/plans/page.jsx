'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, CreditCard, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, Check, Infinity, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const emptyForm = { name: '', price_usd: '', price_gtq: '', max_events: '', max_guests: '', max_users: '', duration_months: 1, is_active: 1 };

const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function AdminPlansPage() {
  const [plans, setPlans]             = useState([]);
  const [grouped, setGrouped]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [editId, setEditId]           = useState(null);
  const [saving, setSaving]           = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planPerms, setPlanPerms]     = useState({});
  const [savingPerms, setSavingPerms] = useState(false);

  const load = useCallback(async () => {
    try {
      const [plansRes, groupedRes] = await Promise.all([
        api.get('/plans'),
        api.get('/permissions/grouped'),
      ]);
      const plansData = plansRes.data.data || [];
      // Fetch permissions for each plan
      const permsMap = {};
      await Promise.all(plansData.map(async (plan) => {
        const { data } = await api.get(`/plans/${plan.id}`);
        permsMap[plan.id] = new Set((data.data?.permissions || []).map(p => p.id));
      }));
      setPlans(plansData);
      setPlanPerms(permsMap);
      setGrouped(groupedRes.data.data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar planes' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price_usd:       parseFloat(form.price_usd),
        price_gtq:       parseFloat(form.price_gtq),
        max_events:      form.max_events === '' ? null : parseInt(form.max_events),
        max_guests:      form.max_guests === '' ? null : parseInt(form.max_guests),
        max_users:       form.max_users  === '' ? null : parseInt(form.max_users),
        duration_months: parseInt(form.duration_months) || 1,
      };
      if (editId) {
        await api.put(`/plans/${editId}`, payload);
        toast({ title: 'Plan actualizado' });
      } else {
        await api.post('/plans', payload);
        toast({ title: 'Plan creado' });
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleEdit = (plan) => {
    setForm({
      name: plan.name, price_usd: plan.price_usd, price_gtq: plan.price_gtq,
      max_events: plan.max_events ?? '', max_guests: plan.max_guests ?? '',
      max_users: plan.max_users ?? '', duration_months: plan.duration_months ?? 1,
      is_active: plan.is_active,
    });
    setEditId(plan.id);
    setShowForm(true);
    setEditingPlan(null);
  };

  const handleToggle = async (plan) => {
    try {
      await api.put(`/plans/${plan.id}`, { is_active: plan.is_active ? 0 : 1 });
      toast({ title: `Plan ${plan.is_active ? 'desactivado' : 'activado'}` });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const togglePerm = (planId, permId) => {
    setPlanPerms(prev => {
      const set = new Set(prev[planId] || []);
      set.has(permId) ? set.delete(permId) : set.add(permId);
      return { ...prev, [planId]: set };
    });
  };

  const toggleModule = (planId, modulePerms) => {
    setPlanPerms(prev => {
      const set = new Set(prev[planId] || []);
      const allSelected = modulePerms.every(p => set.has(p.id));
      modulePerms.forEach(p => allSelected ? set.delete(p.id) : set.add(p.id));
      return { ...prev, [planId]: set };
    });
  };

  const savePermissions = async (planId) => {
    setSavingPerms(true);
    try {
      const permIds = Array.from(planPerms[planId] || []);
      await api.put(`/plans/${planId}/permissions`, { permission_ids: permIds });
      toast({ title: 'Permisos del plan guardados' });
      setEditingPlan(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSavingPerms(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes</h1>
          <p className="text-gray-500 mt-1">Gestiona los planes y sus permisos por módulo</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{editId ? 'Editar Plan' : 'Crear Plan'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Basic, Pro, Agency..." />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Precio USD</label>
                <input type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.price_usd} onChange={e => setForm({ ...form, price_usd: e.target.value })} required placeholder="19.00" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Precio GTQ</label>
                <input type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.price_gtq} onChange={e => setForm({ ...form, price_gtq: e.target.value })} required placeholder="150.00" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Máx. Eventos <span className="text-xs text-gray-400">(vacío=ilimitado)</span></label>
                <input type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.max_events} onChange={e => setForm({ ...form, max_events: e.target.value })} placeholder="Ilimitado" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Máx. Invitados</label>
                <input type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.max_guests} onChange={e => setForm({ ...form, max_guests: e.target.value })} placeholder="Ilimitado" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Máx. Usuarios</label>
                <input type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.max_users} onChange={e => setForm({ ...form, max_users: e.target.value })} placeholder="Ilimitado" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  <Clock className="inline w-3.5 h-3.5 mr-1 text-violet-500" />Duración (meses)
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.duration_months}
                  onChange={e => setForm({ ...form, duration_months: parseInt(e.target.value) })}
                >
                  {DURATION_OPTIONS.map(m => (
                    <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-3 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {plans.map(plan => {
          const isEditing = editingPlan?.id === plan.id;
          const currentPerms = planPerms[plan.id] || new Set();

          return (
            <Card key={plan.id} className={`${!plan.is_active ? 'opacity-60' : ''} ${isEditing ? 'ring-2 ring-violet-400' : ''}`}>
              <CardContent className="p-0">
                {/* Plan header */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
                      <Badge variant={plan.is_active ? 'success' : 'secondary'}>{plan.is_active ? 'Activo' : 'Inactivo'}</Badge>
                      <span className="text-sm text-gray-500">${plan.price_usd} USD / Q{plan.price_gtq} GTQ</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>Eventos: {plan.max_events ?? '∞'}</span>
                      <span>Invitados: {plan.max_guests ?? '∞'}</span>
                      <span>Usuarios: {plan.max_users ?? '∞'}</span>
                      <span className="text-violet-500 font-semibold flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{plan.duration_months ?? 1} {(plan.duration_months ?? 1) === 1 ? 'mes' : 'meses'}
                      </span>
                      <span className="text-violet-600 font-medium">{currentPerms.size} permisos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingPlan(isEditing ? null : plan)}>
                      {isEditing ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      Permisos
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggle(plan)}>
                      {plan.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>

                {/* Permission checkboxes by module */}
                {isEditing && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {grouped.map(({ module, permissions }) => {
                      const allChecked = permissions.every(p => currentPerms.has(p.id));
                      const someChecked = permissions.some(p => currentPerms.has(p.id));
                      return (
                        <div key={module}>
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => toggleModule(plan.id, permissions)}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                allChecked ? 'bg-violet-600 border-violet-600' : someChecked ? 'bg-violet-200 border-violet-400' : 'border-gray-300'
                              }`}
                            >
                              {(allChecked || someChecked) && <Check className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{module}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-6">
                            {permissions.map(perm => (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                                <button
                                  onClick={() => togglePerm(plan.id, perm.id)}
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    currentPerms.has(perm.id) ? 'bg-violet-600 border-violet-600' : 'border-gray-300 group-hover:border-violet-400'
                                  }`}
                                >
                                  {currentPerms.has(perm.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                </button>
                                <span className="text-xs text-gray-600 leading-tight">{perm.description}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                      <Button size="sm" onClick={() => savePermissions(plan.id)} disabled={savingPerms}>
                        {savingPerms ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Guardar permisos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
