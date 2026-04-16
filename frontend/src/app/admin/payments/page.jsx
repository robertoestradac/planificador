'use client';
import { useEffect, useState, useRef } from 'react';
import SearchableSelect from '@/components/ui/searchable-select';
import {
  DollarSign, Clock, CheckCircle, XCircle, Search,
  ChevronLeft, ChevronRight, Loader2, Building2, CreditCard,
  CheckCheck, Ban, Plus, X, RefreshCw, Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 15;

const STATUS_LABEL = { pending: 'Pendiente', confirmed: 'Confirmado', rejected: 'Rechazado' };
const STATUS_VARIANT = { pending: 'warning', confirmed: 'success', rejected: 'destructive' };
const METHOD_LABEL   = { bank_transfer: 'Depósito bancario', payment_link: 'Link de pago' };

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState(null);

  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  /* ── create payment modal ── */
  const [showCreate, setShowCreate] = useState(false);
  const [tenants, setTenants]       = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [plans, setPlans]           = useState([]);
  const [cForm, setCForm]           = useState({ tenant_id: '', plan_id: '', amount: '', currency: 'USD', method: 'bank_transfer', reference: '', notes: '' });
  const [saving, setSaving]         = useState(false);

  /* ── action menu ── */
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos]   = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);

  /* ── confirm / reject dialog ── */
  const [actionPayment, setActionPayment] = useState(null);
  const [actionType, setActionType]       = useState(null);
  const [actioning, setActioning]         = useState(false);

  /* ── edit modal ── */
  const [editPayment, setEditPayment] = useState(null);
  const [eForm, setEForm]             = useState({});
  const [editSaving, setEditSaving]   = useState(false);

  const openEdit = (p) => {
    setEditPayment(p);
    setEForm({
      plan_id:   p.plan_id   || '',
      amount:    String(p.amount || ''),
      currency:  p.currency  || 'USD',
      method:    p.method    || 'bank_transfer',
      status:    p.status    || 'pending',
      reference: p.reference || '',
      notes:     p.notes     || '',
    });
    if (!plans.length) fetchPlans();
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const { status, ...rest } = eForm;
      const payload = {
        ...rest,
        amount:    parseFloat(eForm.amount),
        reference: eForm.reference || null,
        notes:     eForm.notes     || null,
      };
      await api.patch(`/payments/${editPayment.id}`, payload);
      if (status !== editPayment.status) {
        await api.patch(`/payments/${editPayment.id}/${status}`);
      }
      toast({ title: 'Pago actualizado' });
      setEditPayment(null);
      fetchPayments(page); fetchStats();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setEditSaving(false); }
  };

  /* ── auto-fill amount when plan changes in edit modal ── */
  useEffect(() => {
    if (!editPayment) return;
    const p = plans.find(pl => pl.id === eForm.plan_id);
    if (p) setEForm(f => ({ ...f, amount: String(p.price_usd || f.amount) }));
  }, [eForm.plan_id]);  // eslint-disable-line

  /* ─── fetch ─── */
  const fetchPayments = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (filterStatus) params.set('status', filterStatus);
      if (filterMethod) params.set('method', filterMethod);
      const { data } = await api.get(`/payments?${params}`);
      setPayments(data.data?.data || []);
      setTotal(data.data?.total || 0);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los pagos' });
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const { data } = await api.get('/payments/stats'); setStats(data.data); } catch {}
  };

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const { data } = await api.get('/tenants?limit=200');
      setTenants(data.data?.data || []);
    } catch (err) {
      console.error('fetchTenants error:', err.response?.data || err.message);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los tenants' });
    } finally { setLoadingTenants(false); }
  };

  const fetchPlans = async () => {
    try { const { data } = await api.get('/plans?active_only=true'); setPlans(data.data || []); } catch {}
  };

  useEffect(() => { fetchStats(); fetchTenants(); fetchPlans(); }, []);
  useEffect(() => { fetchPayments(page); }, [page, filterStatus, filterMethod]);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── create payment ─── */
  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...cForm,
        amount: parseFloat(cForm.amount),
        ...(cForm.reference ? {} : { reference: null }),
        ...(cForm.notes     ? {} : { notes: null }),
      };
      await api.post('/payments', payload);
      toast({ title: 'Pago registrado exitosamente' });
      setShowCreate(false);
      setCForm({ tenant_id: '', plan_id: '', amount: '', currency: 'USD', method: 'bank_transfer', reference: '', notes: '' });
      fetchPayments(1); fetchStats();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  /* ─── confirm / reject ─── */
  const handleAction = async () => {
    setActioning(true);
    try {
      await api.patch(`/payments/${actionPayment.id}/${actionType}`);
      toast({ title: actionType === 'confirm' ? 'Pago confirmado' : 'Pago rechazado' });
      setActionPayment(null); fetchPayments(page); fetchStats();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setActioning(false); }
  };

  const filtered = payments.filter(p =>
    !search ||
    p.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.plan_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ─── auto-fill amount from plan (create) ─── */
  useEffect(() => {
    const p = plans.find(pl => pl.id === cForm.plan_id);
    if (p) setCForm(f => ({ ...f, amount: String(p.price_usd || '') }));
  }, [cForm.plan_id]);  // eslint-disable-line

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500 mt-1">Registro y seguimiento de pagos por plan</p>
        </div>
        <Button onClick={() => { setShowCreate(true); if (!tenants.length) fetchTenants(); }} className="gap-2 bg-pink-500 hover:bg-pink-600">
          <Plus className="w-4 h-4" /> Registrar pago
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total pagos',    value: stats.total,            icon: CreditCard,  color: 'text-gray-700',   bg: 'bg-gray-100' },
            { label: 'Pendientes',     value: stats.pending,          icon: Clock,       color: 'text-amber-700',  bg: 'bg-amber-100' },
            { label: 'Confirmados',    value: stats.confirmed,        icon: CheckCircle, color: 'text-green-700',  bg: 'bg-green-100' },
            { label: 'Este mes',       value: `$${Number(stats.amount_this_month).toFixed(2)}`, icon: DollarSign, color: 'text-violet-700', bg: 'bg-violet-100' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                  <Icon className={cn('w-5 h-5', color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tenant, plan, referencia..." className="pl-9" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmados</option>
              <option value="rejected">Rechazados</option>
            </select>
            <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Todos los métodos</option>
              <option value="bank_transfer">Depósito bancario</option>
              <option value="payment_link">Link de pago</option>
            </select>
            <button onClick={() => { fetchPayments(page); fetchStats(); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground ml-auto">{total} registros</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap">Tenant</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap hidden sm:table-cell">Plan</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap">Monto</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap hidden md:table-cell">Método</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap hidden md:table-cell">Referencia</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap">Estado</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap hidden lg:table-cell">Fecha</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-violet-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{payment.tenant_name}</p>
                              <p className="text-xs text-gray-400 font-mono">{payment.subdomain}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          <div>
                            <p className="text-sm text-gray-800 font-medium">{payment.plan_name}</p>
                            <p className="text-xs text-gray-400">
                              {payment.max_events != null ? `${payment.max_events} eventos` : '∞ eventos'} ·{' '}
                              {payment.max_guests != null ? `${payment.max_guests} invitados` : '∞ invitados'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-bold text-gray-900">${Number(payment.amount).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{payment.currency}</p>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <span className="text-xs text-gray-600">{METHOD_LABEL[payment.method] || payment.method}</span>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <span className="text-xs font-mono text-gray-500">{payment.reference || '—'}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={STATUS_VARIANT[payment.status]} className="whitespace-nowrap">
                            {STATUS_LABEL[payment.status]}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(payment)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors" title="Editar">
                              <Pencil className="w-4 h-4" />
                            </button>
                            {payment.status === 'pending' && (
                              <button onClick={() => { setActionPayment(payment); setActionType('confirm'); }}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Confirmar">
                                <CheckCheck className="w-4 h-4" />
                              </button>
                            )}
                            {payment.status === 'pending' && (
                              <button onClick={() => { setActionPayment(payment); setActionType('reject'); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Rechazar">
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {payment.status !== 'pending' && (
                              <span className="text-xs text-gray-400 pr-1">
                                {payment.confirmed_by_name ? `por ${payment.confirmed_by_name}` : ''}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">No se encontraron pagos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  <p className="text-xs text-gray-500">
                    Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => { if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…'); acc.push(p); return acc; }, [])
                      .map((p, i) => p === '…'
                        ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                        : <button key={p} onClick={() => setPage(p)}
                            className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                              page === p ? 'bg-violet-600 text-white' : 'hover:bg-gray-100 text-gray-700')}>{p}</button>
                      )}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── CREATE PAYMENT MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white w-full sm:max-w-lg flex flex-col
            rounded-t-2xl sm:rounded-2xl shadow-2xl
            max-h-[92dvh] sm:max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="font-bold text-gray-900">Registrar Pago</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <Label>Tenant <span className="text-pink-500">*</span></Label>
                  <SearchableSelect
                    options={tenants.map(t => ({ value: t.id, label: t.name, sublabel: t.subdomain }))}
                    value={cForm.tenant_id || null}
                    onChange={val => setCForm(f => ({ ...f, tenant_id: val || '' }))}
                    placeholder="Selecciona un tenant..."
                    searchPlaceholder="Buscar por nombre o subdominio..."
                    noOptionsText="Sin tenants encontrados"
                    isLoading={loadingTenants}
                    renderOption={({ option, isSelected, isHighlighted }) => (
                      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-violet-600 text-white' : isHighlighted ? 'bg-violet-50' : 'hover:bg-gray-50'
                      }`}>
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-violet-500' : 'bg-violet-100'
                        }`}>
                          <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-violet-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium leading-none truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>{option.label}</p>
                          <p className={`text-xs font-mono mt-0.5 ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>{option.sublabel}</p>
                        </div>
                      </div>
                    )}
                    renderValue={(option) => (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3 h-3 text-violet-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">{option.label}</span>
                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">{option.sublabel}</span>
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Plan <span className="text-pink-500">*</span></Label>
                  <select value={cForm.plan_id} onChange={e => setCForm(f => ({ ...f, plan_id: e.target.value }))} required
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="">Selecciona un plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price_usd} ({p.max_events != null ? `${p.max_events} eventos` : '∞'} / {p.max_guests != null ? `${p.max_guests} invitados` : '∞'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Monto <span className="text-pink-500">*</span></Label>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" value={cForm.amount}
                      onChange={e => setCForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Moneda</Label>
                    <select value={cForm.currency} onChange={e => setCForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option value="USD">USD</option>
                      <option value="GTQ">GTQ</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Método de pago</Label>
                  <div className="flex gap-2">
                    {[['bank_transfer', 'Depósito bancario'], ['payment_link', 'Link de pago (próx.)']].map(([val, label]) => (
                      <label key={val} className={cn('flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-sm transition-all',
                        cForm.method === val ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        <input type="radio" name="method" value={val} checked={cForm.method === val}
                          onChange={() => setCForm(f => ({ ...f, method: val }))} className="accent-violet-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Referencia bancaria</Label>
                  <Input placeholder="Nº de transferencia, comprobante..." value={cForm.reference}
                    onChange={e => setCForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <textarea value={cForm.notes} onChange={e => setCForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Observaciones internas..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 sm:rounded-b-2xl flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Registrar pago'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PAYMENT MODAL ── */}
      {editPayment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditPayment(null)} />
          <div className="relative bg-white w-full sm:max-w-lg flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] sm:max-h-[88vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 leading-none">Editar Pago</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{editPayment.tenant_name}</p>
                </div>
              </div>
              <button onClick={() => setEditPayment(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

                {/* Status selector */}
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <div className="flex gap-2">
                    {[['pending','Pendiente','bg-amber-50 border-amber-400 text-amber-700'],
                      ['confirmed','Confirmado','bg-green-50 border-green-500 text-green-700'],
                      ['rejected','Rechazado','bg-red-50 border-red-400 text-red-700']].map(([val, label, active]) => (
                      <label key={val} className={cn(
                        'flex items-center gap-1.5 flex-1 px-2.5 py-2 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all',
                        eForm.status === val ? active : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}>
                        <input type="radio" name="estatus" value={val} checked={eForm.status === val}
                          onChange={() => setEForm(f => ({ ...f, status: val }))} className="accent-violet-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                  {eForm.status !== editPayment?.status && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mt-1">
                      ⚠ Cambiar el estado actualizará los créditos del tenant.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Plan <span className="text-pink-500">*</span></Label>
                  <select value={eForm.plan_id} onChange={e => setEForm(f => ({ ...f, plan_id: e.target.value }))} required
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="">Selecciona un plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price_usd} ({p.max_events != null ? `${p.max_events} eventos` : '∞'} / {p.max_guests != null ? `${p.max_guests} invitados` : '∞'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Monto <span className="text-pink-500">*</span></Label>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" value={eForm.amount}
                      onChange={e => setEForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Moneda</Label>
                    <select value={eForm.currency} onChange={e => setEForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option value="USD">USD</option>
                      <option value="GTQ">GTQ</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Método de pago</Label>
                  <div className="flex gap-2">
                    {[['bank_transfer', 'Depósito bancario'], ['payment_link', 'Link de pago (próx.)']].map(([val, label]) => (
                      <label key={val} className={cn('flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-sm transition-all',
                        eForm.method === val ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        <input type="radio" name="emethod" value={val} checked={eForm.method === val}
                          onChange={() => setEForm(f => ({ ...f, method: val }))} className="accent-violet-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Referencia bancaria</Label>
                  <Input placeholder="Nº de transferencia, comprobante..." value={eForm.reference}
                    onChange={e => setEForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <textarea value={eForm.notes} onChange={e => setEForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Observaciones internas..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 sm:rounded-b-2xl flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setEditPayment(null)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={editSaving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                  {editSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM / REJECT DIALOG ── */}
      {actionPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActionPayment(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4',
              actionType === 'confirm' ? 'bg-green-100' : 'bg-red-100')}>
              {actionType === 'confirm'
                ? <CheckCheck className="w-7 h-7 text-green-600" />
                : <Ban className="w-7 h-7 text-red-600" />}
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-1">
              {actionType === 'confirm' ? '¿Confirmar pago?' : '¿Rechazar pago?'}
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{actionPayment.tenant_name}</strong> · Plan <strong>{actionPayment.plan_name}</strong>
            </p>
            <p className="text-lg font-bold text-gray-900 mb-1">${Number(actionPayment.amount).toFixed(2)} {actionPayment.currency}</p>
            {actionPayment.reference && (
              <p className="text-xs text-gray-400 mb-4">Ref: {actionPayment.reference}</p>
            )}
            {actionType === 'confirm' && (
              <p className="text-xs text-green-600 bg-green-50 rounded-lg p-2 mb-4">
                Al confirmar, se acreditarán los permisos del plan al tenant.
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setActionPayment(null)} className="flex-1">Cancelar</Button>
              <Button onClick={handleAction} disabled={actioning}
                className={cn('flex-1 text-white', actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}>
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : actionType === 'confirm' ? 'Confirmar' : 'Rechazar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
