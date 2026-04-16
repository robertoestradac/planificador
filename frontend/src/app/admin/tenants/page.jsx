'use client';
import { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, Building2, CheckCircle, XCircle, X,
  User, Mail, Lock, Globe, Eye, EyeOff, Loader2,
  MoreHorizontal, Pencil, Trash2, BarChart3, ChevronLeft, ChevronRight,
  CreditCard, Calendar, Users, FileText, ShieldOff, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const EMPTY_FORM = {
  name: '', subdomain: '', custom_domain: '',
  owner_name: '', owner_email: '', owner_password: '',
  plan_id: '',
};
const PAGE_SIZE = 10;

export default function TenantsPage() {
  /* ── list state ── */
  const [tenants, setTenants]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [plans, setPlans]         = useState([]);

  /* ── create modal ── */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const [step, setStep]           = useState(1);

  /* ── edit modal ── */
  const [editTenant, setEditTenant]   = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [savingEdit, setSavingEdit]   = useState(false);
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [editTab, setEditTab]         = useState('tenant');

  /* ── view/stats modal ── */
  const [viewTenant, setViewTenant]   = useState(null);
  const [stats, setStats]             = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /* ── delete confirm ── */
  const [deleteTenant, setDeleteTenant] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── action dropdown ── */
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos]   = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);

  /* ─── fetch ─── */
  const fetchTenants = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tenants?page=${p}&limit=${PAGE_SIZE}`);
      setTenants(data.data?.data || []);
      setTotal(data.data?.total || 0);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los tenants' });
    } finally { setLoading(false); }
  };

  const fetchPlans = async () => {
    try { const { data } = await api.get('/plans?active_only=true'); setPlans(data.data || []); } catch {}
  };

  useEffect(() => { fetchTenants(1); fetchPlans(); }, []);
  useEffect(() => { fetchTenants(page); }, [page]);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── create ─── */
  const openModal = () => { setForm(EMPTY_FORM); setStep(1); setShowModal(true); };
  const closeModal = () => setShowModal(false);
  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toSlug = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 50);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name, subdomain: form.subdomain.toLowerCase(),
        ...(form.custom_domain  && { custom_domain:  form.custom_domain }),
        ...(form.plan_id        && { plan_id:        form.plan_id }),
        ...(form.owner_name     && { owner_name:     form.owner_name }),
        ...(form.owner_email    && { owner_email:    form.owner_email }),
        ...(form.owner_password && { owner_password: form.owner_password }),
      };
      await api.post('/tenants', payload);
      toast({ title: '¡Tenant creado!', description: `${form.name} fue creado exitosamente` });
      closeModal(); fetchTenants(page);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Error al crear tenant' });
    } finally { setSaving(false); }
  };

  /* ─── toggle status ─── */
  const handleToggleStatus = async (tenant) => {
    try {
      const action = tenant.status === 'active' ? 'suspend' : 'activate';
      await api.patch(`/tenants/${tenant.id}/${action}`);
      toast({ title: 'Estado actualizado' });
      fetchTenants(page);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  /* ─── edit ─── */
  const openEdit = (t) => {
    setEditTenant(t);
    setEditForm({
      name: t.name, subdomain: t.subdomain,
      owner_name: t.owner_name || '', owner_email: t.owner_email || '', owner_password: '',
      plan_id: '',
    });
    setEditTab('tenant');
    setShowEditPwd(false);
    setOpenMenu(null);
  };
  const handleEdit = async (e) => {
    e.preventDefault(); setSavingEdit(true);
    try {
      const payload = {
        name: editForm.name,
        subdomain: editForm.subdomain,
        ...(editForm.owner_name     && { owner_name:     editForm.owner_name }),
        ...(editForm.owner_email    && { owner_email:    editForm.owner_email }),
        ...(editForm.owner_password && { owner_password: editForm.owner_password }),
        ...(editForm.plan_id        && { plan_id:        editForm.plan_id }),
      };
      await api.put(`/tenants/${editTenant.id}`, payload);
      toast({ title: 'Tenant actualizado' });
      setEditTenant(null); fetchTenants(page);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSavingEdit(false); }
  };

  /* ─── view stats ─── */
  const openView = async (t) => {
    setViewTenant(t); setStats(null); setLoadingStats(true); setOpenMenu(null);
    try { const { data } = await api.get(`/tenants/${t.id}/stats`); setStats(data.data); }
    catch {} finally { setLoadingStats(false); }
  };

  /* ─── delete ─── */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tenants/${deleteTenant.id}`);
      toast({ title: 'Tenant eliminado' });
      setDeleteTenant(null); fetchTenants(page);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setDeleting(false); }
  };

  /* ─── derived ─── */
  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const step1Valid = form.name.trim().length >= 2 && form.subdomain.trim().length >= 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">Gestiona todas las empresas en la plataforma</p>
        </div>
        <Button onClick={openModal} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Tenant
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tenant..." className="pl-9" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-sm text-muted-foreground">{total} tenants</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap">Empresa</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap hidden sm:table-cell">Owner</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap hidden md:table-cell">Plan</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap">Estado</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap hidden lg:table-cell">Creado</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(tenant => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{tenant.name}</p>
                              <p className="text-xs text-gray-400 font-mono truncate">{tenant.subdomain}</p>
                              {/* mobile: show plan+owner inline */}
                              <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                                {tenant.plan_name && (
                                  <span className="text-xs text-violet-600 font-medium">{tenant.plan_name}</span>
                                )}
                                {tenant.owner_email && (
                                  <span className="text-xs text-gray-400 truncate">{tenant.owner_email}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          {tenant.owner_name ? (
                            <div className="min-w-0">
                              <p className="text-sm text-gray-700 truncate max-w-[160px]">{tenant.owner_name}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">{tenant.owner_email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin owner</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          {tenant.plan_name ? (
                            <Badge variant="outline" className="text-violet-700 border-violet-300 bg-violet-50 font-medium whitespace-nowrap">
                              {tenant.plan_name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin plan</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={tenant.status === 'active' ? 'success' : 'destructive'} className="whitespace-nowrap">
                            {tenant.status === 'active' ? 'Activo' : 'Suspendido'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs whitespace-nowrap hidden lg:table-cell">{formatDate(tenant.created_at)}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setOpenMenu(openMenu === tenant.id ? null : tenant.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No se encontraron tenants</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Fixed dropdown — rendered at viewport level, never clipped */}
              {openMenu && (
                <div ref={menuRef}
                  style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
                  className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden">
                  {(() => { const tenant = tenants.find(t => t.id === openMenu); if (!tenant) return null; return (
                    <>
                      <button onClick={() => openView(tenant)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <BarChart3 className="w-3.5 h-3.5 text-violet-500" /> Ver estadísticas
                      </button>
                      <button onClick={() => openEdit(tenant)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Pencil className="w-3.5 h-3.5 text-blue-500" /> Editar
                      </button>
                      <button onClick={() => { handleToggleStatus(tenant); setOpenMenu(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        {tenant.status === 'active'
                          ? <><ShieldOff className="w-3.5 h-3.5 text-amber-500" /> Suspender</>
                          : <><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Activar</>}
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { setDeleteTenant(tenant); setOpenMenu(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </>
                  );})()}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  <p className="text-xs text-gray-500">
                    Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…');
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) => p === '…'
                        ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                        : <button key={p} onClick={() => setPage(p)}
                            className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                              page === p ? 'bg-violet-600 text-white' : 'hover:bg-gray-100 text-gray-700')}>
                            {p}
                          </button>
                      )}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── VIEW STATS MODAL ── */}
      {viewTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewTenant(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{viewTenant.name}</h2>
                  <p className="text-xs text-gray-400 font-mono">{viewTenant.subdomain}</p>
                </div>
              </div>
              <button onClick={() => setViewTenant(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {loadingStats ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { icon: Users,    label: 'Usuarios',     val: stats.users },
                      { icon: Calendar, label: 'Eventos',      val: stats.events },
                      { icon: FileText, label: 'Invitaciones', val: stats.invitations },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <Icon className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-900">{val}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>
                  {stats.subscription ? (
                    <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-violet-600" />
                        <p className="font-semibold text-violet-900 text-sm">{stats.subscription.plan_name}</p>
                        <Badge variant={stats.subscription.status === 'active' ? 'success' : 'destructive'} className="ml-auto text-xs">
                          {stats.subscription.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-violet-600">Vence: {formatDate(stats.subscription.expires_at)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">Sin suscripción activa</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No se pudieron cargar las estadísticas</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditTenant(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Editar Tenant</h2>
                  <p className="text-xs text-gray-400 font-mono">{editTenant.subdomain}</p>
                </div>
              </div>
              <button onClick={() => setEditTenant(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
              {[
                { id: 'tenant', label: 'Empresa',  icon: Building2 },
                { id: 'owner',  label: 'Owner',    icon: User },
                { id: 'plan',   label: 'Plan',     icon: CreditCard },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setEditTab(id)}
                  className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                    editTab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

                {/* ── TENANT TAB ── */}
                {editTab === 'tenant' && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Nombre <span className="text-pink-500">*</span></Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9" value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subdominio <span className="text-pink-500">*</span></Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9 font-mono" value={editForm.subdomain}
                          onChange={e => setEditForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                          required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estado</Label>
                      <div className="flex gap-2">
                        {['active', 'suspended'].map(s => (
                          <label key={s}
                            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all flex-1 justify-center',
                              editTenant.status === s
                                ? s === 'active' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                            {s === 'active'
                              ? <><CheckCircle className="w-4 h-4" /> Activo</>
                              : <><XCircle className="w-4 h-4" /> Suspendido</>}
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">Usa las acciones de la tabla para cambiar el estado</p>
                    </div>
                  </>
                )}

                {/* ── OWNER TAB ── */}
                {editTab === 'owner' && (
                  <>
                    {!editTenant.owner_email && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                        Este tenant no tiene un owner. Completa los 3 campos para crearlo.
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label>Nombre del owner</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9" placeholder="Juan Pérez" value={editForm.owner_name}
                          onChange={e => setEditForm(f => ({ ...f, owner_name: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email del owner</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9" type="email" placeholder="juan@empresa.com" value={editForm.owner_email}
                          onChange={e => setEditForm(f => ({ ...f, owner_email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{editTenant.owner_email ? 'Nueva contraseña' : 'Contraseña'} <span className="text-gray-400 text-xs font-normal">{editTenant.owner_email ? '(dejar vacío para no cambiar)' : ''}</span></Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9 pr-10" type={showEditPwd ? 'text' : 'password'}
                          placeholder="Mínimo 8 caracteres" value={editForm.owner_password}
                          onChange={e => setEditForm(f => ({ ...f, owner_password: e.target.value }))} />
                        <button type="button" onClick={() => setShowEditPwd(p => !p)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          {showEditPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {editForm.owner_password && editForm.owner_password.length < 8 && (
                        <p className="text-xs text-red-500">Mínimo 8 caracteres</p>
                      )}
                    </div>
                  </>
                )}

                {/* ── PLAN TAB ── */}
                {editTab === 'plan' && (
                  <>
                    {editTenant.plan_name && (
                      <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-violet-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-violet-800">Plan actual: {editTenant.plan_name}</p>
                          <p className="text-xs text-violet-600">Selecciona otro plan para cambiarlo</p>
                        </div>
                      </div>
                    )}
                    {plans.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No hay planes activos configurados</p>
                    ) : (
                      <div className="space-y-2">
                        {plans.map(plan => (
                          <label key={plan.id}
                            className={cn('flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
                              editForm.plan_id === plan.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200')}>
                            <div className="flex items-center gap-3">
                              <input type="radio" name="editplan" value={plan.id} checked={editForm.plan_id === plan.id}
                                onChange={() => setEditForm(f => ({ ...f, plan_id: plan.id }))} className="accent-violet-600" />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
                                <p className="text-xs text-gray-500">
                                  {plan.max_events ? `${plan.max_events} eventos` : 'Ilimitados'} ·{' '}
                                  {plan.max_guests ? `${plan.max_guests} invitados` : 'Ilimitados'}
                                </p>
                              </div>
                            </div>
                            <p className="font-bold text-sm text-gray-800">
                              {plan.price_usd > 0 ? `$${plan.price_usd}/mes` : 'Gratis'}
                            </p>
                          </label>
                        ))}
                        <label className={cn('flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          !editForm.plan_id ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300')}>
                          <input type="radio" name="editplan" value="" checked={!editForm.plan_id}
                            onChange={() => setEditForm(f => ({ ...f, plan_id: '' }))} className="accent-violet-600" />
                          <div>
                            <p className="font-semibold text-gray-700 text-sm">No cambiar plan</p>
                            <p className="text-xs text-gray-400">Mantener el plan actual</p>
                          </div>
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setEditTenant(null)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={savingEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTenant(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-1">¿Eliminar tenant?</h2>
            <p className="text-sm text-gray-500 mb-1">
              Esto eliminará <strong>{deleteTenant.name}</strong> y todos sus datos.
            </p>
            <p className="text-xs text-red-500 font-medium mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteTenant(null)} className="flex-1">Cancelar</Button>
              <Button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Eliminando...</> : 'Sí, eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Nuevo Tenant</h2>
                  <p className="text-xs text-gray-400">Paso {step} de 3</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex gap-1 px-6 pt-4">
              {[
                { n: 1, label: 'Empresa' },
                { n: 2, label: 'Owner' },
                { n: 3, label: 'Plan' },
              ].map(({ n, label }) => (
                <button key={n} onClick={() => { if (n < step || (n === 2 && step1Valid)) setStep(n); }}
                  className="flex-1 text-center">
                  <div className={cn('h-1.5 rounded-full transition-colors mb-1',
                    step >= n ? 'bg-violet-600' : 'bg-gray-200')} />
                  <span className={cn('text-xs font-medium', step >= n ? 'text-violet-600' : 'text-gray-400')}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

                {/* STEP 1: Empresa */}
                {step === 1 && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Nombre <span className="text-pink-500">*</span></Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9" placeholder="Mi Empresa"
                          value={form.name}
                          onChange={e => {
                            const name = e.target.value;
                            setF('name', name);
                            setF('subdomain', toSlug(name));
                          }}
                          required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subdominio</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9 font-mono bg-gray-50" placeholder="miempresa"
                          value={form.subdomain}
                          onChange={e => setF('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          required />
                      </div>
                      <p className="text-xs text-gray-400">Generado automáticamente · puedes editarlo</p>
                    </div>
                  </>
                )}

                {/* STEP 2: Owner */}
                {step === 2 && (
                  <>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                      Opcional — Si no configuras un owner ahora, podrás crearlo más tarde desde Usuarios.
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nombre del owner</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9" placeholder="Juan Pérez"
                          value={form.owner_name} onChange={e => setF('owner_name', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email del owner</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9" type="email" placeholder="juan@miempresa.com"
                          value={form.owner_email} onChange={e => setF('owner_email', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input className="pl-9 pr-10" type={showPwd ? 'text' : 'password'}
                          placeholder="Mínimo 8 caracteres"
                          value={form.owner_password} onChange={e => setF('owner_password', e.target.value)} />
                        <button type="button" onClick={() => setShowPwd(p => !p)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {form.owner_password && form.owner_password.length < 8 && (
                        <p className="text-xs text-red-500">Mínimo 8 caracteres</p>
                      )}
                    </div>
                  </>
                )}

                {/* STEP 3: Plan */}
                {step === 3 && (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                      Selecciona el plan inicial. Podrás cambiarlo en cualquier momento desde Suscripciones.
                    </div>
                    {plans.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No hay planes activos configurados</p>
                    ) : (
                      <div className="space-y-2">
                        {plans.map(plan => (
                          <label key={plan.id}
                            className={cn('flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
                              form.plan_id === plan.id
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-gray-200 hover:border-violet-200')}>
                            <div className="flex items-center gap-3">
                              <input type="radio" name="plan" value={plan.id} checked={form.plan_id === plan.id}
                                onChange={() => setF('plan_id', plan.id)} className="accent-violet-600" />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
                                <p className="text-xs text-gray-500">
                                  {plan.max_events ? `${plan.max_events} eventos` : 'Ilimitados'} ·{' '}
                                  {plan.max_guests ? `${plan.max_guests} invitados` : 'Ilimitados'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">
                                {plan.price_usd > 0 ? `$${plan.price_usd}/mes` : 'Gratis'}
                              </p>
                            </div>
                          </label>
                        ))}
                        <label className={cn('flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          !form.plan_id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200')}>
                          <input type="radio" name="plan" value="" checked={!form.plan_id}
                            onChange={() => setF('plan_id', '')} className="accent-violet-600" />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Sin plan por ahora</p>
                            <p className="text-xs text-gray-500">Asignar plan más tarde</p>
                          </div>
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
                <Button type="button" variant="outline" onClick={step === 1 ? closeModal : () => setStep(s => s - 1)}>
                  {step === 1 ? 'Cancelar' : '← Atrás'}
                </Button>
                {step < 3 ? (
                  <Button type="button"
                    disabled={step === 1 && !step1Valid}
                    onClick={() => setStep(s => s + 1)}
                    className="bg-violet-600 hover:bg-violet-700 text-white">
                    Siguiente →
                  </Button>
                ) : (
                  <Button type="submit" disabled={saving || !step1Valid}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creando...</> : <><Plus className="w-4 h-4" />Crear tenant</>}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
