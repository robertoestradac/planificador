'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckSquare, DollarSign, Users, Clock, ArrowLeft,
  Plus, Trash2, Pencil, Check, Loader2, AlertCircle,
  CalendarDays, LayoutGrid,
} from 'lucide-react';
import { GiDiamondRing, GiPartyPopper, GiBabyBottle, GiGraduateCap, GiStarMedal } from 'react-icons/gi';
import { MdCorporateFare, MdCake, MdChurch, MdEvent } from 'react-icons/md';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import CalendarTab from './CalendarTab';
import SeatingTab from './SeatingTab';

const TASK_CATEGORIES   = ['Lugar/Ubicacion','Catering','Decoracion','Musica','Fotografia','Invitaciones','Vestuario','Transporte','Tecnologia','Legal/Documentos','Otros'];
const BUDGET_CATEGORIES = ['Lugar/Ubicacion','Catering','Decoracion','Musica','Fotografia','Vestuario','Transporte','Tecnologia','Otros'];
const VENDOR_SERVICES   = ['Lugar/Ubicacion','Catering','Fotografia','Videografia','Musica/DJ','Decoracion','Pasteleria','Vestuario','Transporte','Tecnologia','Otros'];

const TASK_STATUSES    = { pendiente: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' }, en_progreso: { label: 'En progreso', color: 'bg-blue-100 text-blue-700' }, completado: { label: 'Completado', color: 'bg-green-100 text-green-700' } };
const VENDOR_STATUSES  = { contactado: { label: 'Contactado', color: 'bg-gray-100 text-gray-600' }, cotizado: { label: 'Cotizado', color: 'bg-yellow-100 text-yellow-700' }, contratado: { label: 'Contratado', color: 'bg-blue-100 text-blue-700' }, pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' } };
const PAYMENT_STATUSES = { pendiente: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' }, anticipo: { label: 'Anticipo', color: 'bg-yellow-100 text-yellow-700' }, pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' } };

const EVENT_TYPE_MAP = {
  boda:        { label: 'Boda',        Icon: GiDiamondRing,   color: 'text-pink-500',   bg: 'bg-pink-50'   },
  xv_anos:     { label: 'XV Anos',     Icon: GiStarMedal,     color: 'text-purple-500', bg: 'bg-purple-50' },
  baby_shower: { label: 'Baby Shower', Icon: GiBabyBottle,    color: 'text-sky-500',    bg: 'bg-sky-50'    },
  graduacion:  { label: 'Graduacion',  Icon: GiGraduateCap,   color: 'text-blue-500',   bg: 'bg-blue-50'   },
  corporativo: { label: 'Corporativo', Icon: MdCorporateFare, color: 'text-slate-500',  bg: 'bg-slate-50'  },
  cumpleanos:  { label: 'Cumpleanos',  Icon: MdCake,          color: 'text-orange-500', bg: 'bg-orange-50' },
  bautizo:     { label: 'Bautizo',     Icon: MdChurch,        color: 'text-indigo-500', bg: 'bg-indigo-50' },
  otro:        { label: 'Otro',        Icon: MdEvent,         color: 'text-gray-500',   bg: 'bg-gray-50'   },
};

const TABS = [
  { id: 'checklist', label: 'Checklist',   Icon: CheckSquare },
  { id: 'budget',    label: 'Presupuesto', Icon: DollarSign  },
  { id: 'vendors',   label: 'Proveedores', Icon: Users       },
  { id: 'timeline',  label: 'Cronograma',  Icon: Clock       },
  { id: 'calendar',  label: 'Calendario',  Icon: CalendarDays },
  { id: 'seating',   label: 'Mesas',       Icon: LayoutGrid  },
];

function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

function FieldInput({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" {...props} />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Checklist ──────────────────────────────────────────────────
function ChecklistTab({ planId }) {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const emptyForm = { category: 'Otros', title: '', due_date: '', assignee: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/planner/${planId}/tasks`);
      setTasks(data.data);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar tareas' });
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const cycleStatus = async (task) => {
    const next = task.status === 'completado' ? 'pendiente' : task.status === 'pendiente' ? 'en_progreso' : 'completado';
    try {
      const { data } = await api.put(`/planner/${planId}/tasks/${task.id}`, { status: next });
      setTasks(prev => prev.map(t => t.id === task.id ? data.data : t));
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/planner/${planId}/tasks/${editId}`, form);
        setTasks(prev => prev.map(t => t.id === editId ? data.data : t));
        toast({ title: 'Tarea actualizada' });
      } else {
        const { data } = await api.post(`/planner/${planId}/tasks`, form);
        setTasks(prev => [...prev, data.data]);
        toast({ title: 'Tarea agregada' });
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta tarea?')) return;
    try {
      await api.delete(`/planner/${planId}/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const completed = tasks.filter(t => t.status === 'completado').length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const grouped = tasks.reduce((acc, t) => { (acc[t.category] = acc[t.category] || []).push(t); return acc; }, {});

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-xl">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-violet-900">Progreso general</span>
            <span className="text-violet-700 font-semibold">{pct}%</span>
          </div>
          <div className="h-3 bg-violet-200 rounded-full overflow-hidden">
            <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="text-right text-sm text-violet-700">
          <p className="font-bold text-lg">{completed}/{tasks.length}</p>
          <p className="text-xs">completadas</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>
          <Plus className="w-4 h-4 mr-1" /> Agregar tarea
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <FieldInput label="Tarea *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Descripcion de la tarea" />
              </div>
              <FieldSelect label="Categoria" value={form.category} onChange={v => setForm({ ...form, category: v })} options={TASK_CATEGORIES} />
              <FieldInput label="Fecha limite" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              <FieldInput label="Responsable" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="Nombre del responsable" />
              <FieldInput label="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales" />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" size="sm">{editId ? 'Actualizar' : 'Agregar'}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([cat, catTasks]) => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{cat}</h3>
          <div className="space-y-1.5">
            {catTasks.map(task => (
              <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${task.status === 'completado' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                <button onClick={() => cycleStatus(task)} className="flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completado' ? 'bg-green-500 border-green-500' : task.status === 'en_progreso' ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}>
                    {task.status === 'completado' && <Check className="w-3 h-3 text-white" />}
                    {task.status === 'en_progreso' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'completado' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {task.due_date && <span className="text-xs text-gray-400">{new Date(task.due_date).toLocaleDateString('es-GT')}</span>}
                    {task.assignee && <span className="text-xs text-gray-400">{task.assignee}</span>}
                  </div>
                </div>
                <StatusBadge map={TASK_STATUSES} value={task.status} />
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditId(task.id); setForm({ category: task.category, title: task.title, due_date: task.due_date?.slice(0, 10) || '', assignee: task.assignee || '', notes: task.notes || '' }); setShowForm(true); }}
                    className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Presupuesto ────────────────────────────────────────────────
function BudgetTab({ planId }) {
  const [budget, setBudget]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const emptyForm = { category: 'Otros', name: '', estimated_cost: '', actual_cost: '', payment_status: 'pendiente', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/planner/${planId}/budget`);
      setBudget(data.data);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar presupuesto' });
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      actual_cost: form.actual_cost !== '' ? parseFloat(form.actual_cost) : null,
    };
    try {
      if (editId) {
        const { data } = await api.put(`/planner/${planId}/budget/${editId}`, payload);
        setBudget(prev => ({ ...prev, items: prev.items.map(i => i.id === editId ? data.data : i) }));
        toast({ title: 'Item actualizado' });
      } else {
        const { data } = await api.post(`/planner/${planId}/budget`, payload);
        setBudget(prev => ({ ...prev, items: [...prev.items, data.data] }));
        toast({ title: 'Item agregado' });
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este item?')) return;
    try {
      await api.delete(`/planner/${planId}/budget/${id}`);
      setBudget(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>;
  if (!budget) return null;

  const overBudget = budget.budget_total && budget.total_estimated > budget.budget_total;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {budget.budget_total && (
          <div className="p-3 bg-violet-50 rounded-xl text-center">
            <p className="text-xs text-violet-600 font-medium">Presupuesto total</p>
            <p className="text-lg font-bold text-violet-900">Q{Number(budget.budget_total).toLocaleString()}</p>
          </div>
        )}
        <div className="p-3 bg-blue-50 rounded-xl text-center">
          <p className="text-xs text-blue-600 font-medium">Estimado</p>
          <p className="text-lg font-bold text-blue-900">Q{Number(budget.total_estimated).toLocaleString()}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-xl text-center">
          <p className="text-xs text-green-600 font-medium">Real pagado</p>
          <p className="text-lg font-bold text-green-900">Q{Number(budget.total_actual).toLocaleString()}</p>
        </div>
        {budget.balance !== null && (
          <div className={`p-3 rounded-xl text-center ${overBudget ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium ${overBudget ? 'text-red-600' : 'text-gray-600'}`}>Balance</p>
            <p className={`text-lg font-bold ${overBudget ? 'text-red-700' : 'text-gray-900'}`}>Q{Number(budget.balance).toLocaleString()}</p>
          </div>
        )}
      </div>

      {overBudget && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          El presupuesto estimado supera el total definido
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>
          <Plus className="w-4 h-4 mr-1" /> Agregar gasto
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <FieldInput label="Concepto *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Salon de eventos" />
              </div>
              <FieldSelect label="Categoria" value={form.category} onChange={v => setForm({ ...form, category: v })} options={BUDGET_CATEGORIES} />
              <FieldInput label="Costo estimado *" type="number" min="0" step="0.01" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} required placeholder="0.00" />
              <FieldInput label="Costo real" type="number" min="0" step="0.01" value={form.actual_cost} onChange={e => setForm({ ...form, actual_cost: e.target.value })} placeholder="0.00" />
              <FieldSelect
                label="Estado de pago"
                value={form.payment_status}
                onChange={v => setForm({ ...form, payment_status: v })}
                options={Object.entries(PAYMENT_STATUSES).map(([v, s]) => ({ value: v, label: s.label }))}
              />
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" size="sm">{editId ? 'Actualizar' : 'Agregar'}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {budget.items.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Sin gastos registrados aun</p>
        ) : budget.items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{item.name}</p>
              <p className="text-xs text-gray-400">{item.category}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-gray-800">Q{Number(item.estimated_cost).toLocaleString()}</p>
              {item.actual_cost != null && <p className="text-xs text-gray-400">Real: Q{Number(item.actual_cost).toLocaleString()}</p>}
            </div>
            <StatusBadge map={PAYMENT_STATUSES} value={item.payment_status} />
            <div className="flex gap-1">
              <button
                onClick={() => { setEditId(item.id); setForm({ category: item.category, name: item.name, estimated_cost: item.estimated_cost, actual_cost: item.actual_cost ?? '', payment_status: item.payment_status, notes: item.notes || '' }); setShowForm(true); }}
                className="p-1 text-gray-400 hover:text-violet-600"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Proveedores ────────────────────────────────────────────────
function VendorsTab({ planId }) {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const emptyForm = { service: 'Fotografia', name: '', phone: '', email: '', price: '', status: 'contactado', website: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/planner/${planId}/vendors`);
      setVendors(data.data);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar proveedores' });
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: form.price !== '' ? parseFloat(form.price) : null };
    try {
      if (editId) {
        const { data } = await api.put(`/planner/${planId}/vendors/${editId}`, payload);
        setVendors(prev => prev.map(v => v.id === editId ? data.data : v));
        toast({ title: 'Proveedor actualizado' });
      } else {
        const { data } = await api.post(`/planner/${planId}/vendors`, payload);
        setVendors(prev => [...prev, data.data]);
        toast({ title: 'Proveedor agregado' });
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este proveedor?')) return;
    try {
      await api.delete(`/planner/${planId}/vendors/${id}`);
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>
          <Plus className="w-4 h-4 mr-1" /> Agregar proveedor
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldSelect label="Servicio" value={form.service} onChange={v => setForm({ ...form, service: v })} options={VENDOR_SERVICES} />
              <div className="md:col-span-2">
                <FieldInput label="Nombre del proveedor *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nombre o empresa" />
              </div>
              <FieldInput label="Telefono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+502 0000-0000" />
              <FieldInput label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="proveedor@email.com" />
              <FieldInput label="Precio acordado" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              <FieldSelect
                label="Estado"
                value={form.status}
                onChange={v => setForm({ ...form, status: v })}
                options={Object.entries(VENDOR_STATUSES).map(([v, s]) => ({ value: v, label: s.label }))}
              />
              <FieldInput label="Sitio web" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
              <FieldInput label="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales" />
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" size="sm">{editId ? 'Actualizar' : 'Agregar'}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {vendors.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Sin proveedores registrados aun</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vendors.map(v => (
            <div key={v.id} className="p-4 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.service}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge map={VENDOR_STATUSES} value={v.status} />
                  <button
                    onClick={() => { setEditId(v.id); setForm({ service: v.service, name: v.name, phone: v.phone || '', email: v.email || '', price: v.price ?? '', status: v.status, website: v.website || '', notes: v.notes || '' }); setShowForm(true); }}
                    className="p-1 text-gray-400 hover:text-violet-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(v.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {v.phone   && <span>{v.phone}</span>}
                {v.email   && <span>{v.email}</span>}
                {v.price   && <span className="font-medium text-gray-700">Q{Number(v.price).toLocaleString()}</span>}
                {v.website && (
                  <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                    Sitio web
                  </a>
                )}
              </div>
              {v.notes && <p className="text-xs text-gray-400 mt-1.5 italic">{v.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cronograma ─────────────────────────────────────────────────
function TimelineTab({ planId }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const emptyForm = { start_time: '', end_time: '', activity: '', assignee: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/planner/${planId}/timeline`);
      setItems(data.data);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar cronograma' });
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/planner/${planId}/timeline/${editId}`, form);
        setItems(prev => prev.map(i => i.id === editId ? data.data : i).sort((a, b) => a.start_time.localeCompare(b.start_time)));
        toast({ title: 'Actividad actualizada' });
      } else {
        const { data } = await api.post(`/planner/${planId}/timeline`, form);
        setItems(prev => [...prev, data.data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
        toast({ title: 'Actividad agregada' });
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta actividad?')) return;
    try {
      await api.delete(`/planner/${planId}/timeline/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>
          <Plus className="w-4 h-4 mr-1" /> Agregar actividad
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldInput label="Hora inicio *" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
              <FieldInput label="Hora fin" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              <FieldInput label="Responsable" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="Nombre del responsable" />
              <div className="md:col-span-2">
                <FieldInput label="Actividad *" value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} required placeholder="Ej: Llegada de invitados" />
              </div>
              <FieldInput label="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales" />
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" size="sm">{editId ? 'Actualizar' : 'Agregar'}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Sin actividades en el cronograma aun</p>
      ) : (
        <div className="relative">
          <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex gap-4 items-start">
                <div className="w-[52px] text-right flex-shrink-0 pt-2">
                  <span className="text-xs font-bold text-violet-700">{item.start_time?.slice(0, 5)}</span>
                </div>
                <div className="relative flex-shrink-0 mt-2.5">
                  <div className="w-3 h-3 rounded-full bg-violet-600 border-2 border-white ring-2 ring-violet-200" />
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between bg-white border border-gray-200 rounded-xl p-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.activity}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.end_time && <span className="text-xs text-gray-400">hasta {item.end_time?.slice(0, 5)}</span>}
                        {item.assignee && <span className="text-xs text-gray-400">{item.assignee}</span>}
                      </div>
                      {item.notes && <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => { setEditId(item.id); setForm({ start_time: item.start_time?.slice(0, 5) || '', end_time: item.end_time?.slice(0, 5) || '', activity: item.activity, assignee: item.assignee || '', notes: item.notes || '' }); setShowForm(true); }}
                        className="p-1 text-gray-400 hover:text-violet-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pagina principal del plan ──────────────────────────────────
export default function PlanDetailPage() {
  const { planId } = useParams();
  const router     = useRouter();
  const [plan, setPlan]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('checklist');

  useEffect(() => {
    api.get(`/planner/${planId}`)
      .then(r => setPlan(r.data.data))
      .catch(() => {
        toast({ variant: 'destructive', title: 'Plan no encontrado' });
        router.push('/dashboard/planner');
      })
      .finally(() => setLoading(false));
  }, [planId, router]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
  if (!plan) return null;

  const type = EVENT_TYPE_MAP[plan.event_type] || EVENT_TYPE_MAP.otro;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push('/dashboard/planner')}
          className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${type.bg}`}>
              <type.Icon className={`w-6 h-6 ${type.color}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{plan.event_name}</h1>
              <p className="text-gray-400 text-sm">
                {type.label}
                {plan.event_date && (
                  <span> &middot; {new Date(plan.event_date).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 -mx-4 sm:mx-0">
        <div className="overflow-x-auto scrollbar-hide">
          <nav className="flex gap-1 -mb-px px-4 sm:px-0 min-w-max">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
          </nav>
        </div>
      </div>

      <div>
        {tab === 'checklist' && <ChecklistTab planId={planId} />}
        {tab === 'budget'    && <BudgetTab    planId={planId} />}
        {tab === 'vendors'   && <VendorsTab   planId={planId} />}
        {tab === 'timeline'  && <TimelineTab  planId={planId} />}
        {tab === 'calendar'  && <CalendarTab  planId={planId} />}
        {tab === 'seating'   && <SeatingTab   planId={planId} />}
      </div>
    </div>
  );
}
