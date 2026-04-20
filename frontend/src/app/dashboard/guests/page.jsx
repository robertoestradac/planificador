'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Users, Search, CheckCircle, XCircle, Clock, Upload, Download, Trash2,
  Edit2, Copy, MessageCircle, QrCode, UserCheck, RefreshCw, TrendingUp,
  Filter, ChevronUp, ChevronDown, UtensilsCrossed, StickyNote, MoreVertical,
  LayoutGrid, Armchair, Send, MailCheck, MailX,
} from 'lucide-react';
import Link from 'next/link';
import NoPlanBanner from '@/components/ui/no-plan-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { toast } from '@/hooks/use-toast';
import GuestFormModal from './GuestFormModal';
import ImportModal from './ImportModal';
import QRModal from './QRModal';
import CheckInMode from './CheckInMode';
import TimelineChart from './TimelineChart';
import ConfirmDialog from './ConfirmDialog';
import { buildGuestLink, buildWhatsAppUrl, defaultWhatsAppMessage } from './utils';

const statusConfig = {
  confirmed: { label: 'Confirmado', variant: 'success',     icon: CheckCircle, color: 'text-green-600' },
  declined:  { label: 'Declinó',    variant: 'destructive', icon: XCircle,     color: 'text-red-600' },
  pending:   { label: 'Pendiente',  variant: 'secondary',   icon: Clock,       color: 'text-yellow-600' },
};

export default function GuestsPage() {
  // ── Data ────────────────────────────────────────────────────────
  const [invitations, setInvitations]           = useState([]);
  const [selectedInv, setSelectedInv]           = useState('');
  const [guests, setGuests]                     = useState([]);
  const [stats, setStats]                       = useState(null);
  const [groups, setGroups]                     = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [noPlan, setNoPlan]                     = useState(false);
  const [selectedIds, setSelectedIds]           = useState(new Set());

  // ── Filters & search ────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterHasEmail, setFilterHasEmail] = useState('');
  const [filterHasPhone, setFilterHasPhone] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState('');
  const [filterHasTable, setFilterHasTable] = useState('');
  const [filterSent, setFilterSent]         = useState('');
  const [sortBy, setSortBy]           = useState('created_at');
  const [sortDir, setSortDir]         = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // ── Modals & UI ─────────────────────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [editGuest, setEditGuest]     = useState(null);
  const [showImport, setShowImport]   = useState(false);
  const [qrGuest, setQrGuest]         = useState(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [confirm, setConfirm]         = useState(null);
  const [rowMenu, setRowMenu]         = useState(null); // { id, top, right }

  const openRowMenu = (guest, evt) => {
    if (rowMenu?.id === guest.id) { setRowMenu(null); return; }
    const rect = evt.currentTarget.getBoundingClientRect();
    const MENU_HEIGHT = 280; // approximate height of the menu
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow;

    setRowMenu({
      id: guest.id,
      top:    openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? viewportH - rect.top + 4 : undefined,
      right:  window.innerWidth - rect.right,
      guest,
    });
  };

  // Close menu on scroll/resize
  useEffect(() => {
    if (!rowMenu) return;
    const close = () => setRowMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [rowMenu]);

  // ── Load invitations ────────────────────────────────────────────
  useEffect(() => {
    dataCache.fetchers.invitations().then(list => {
      setInvitations(list);
      if (list.length > 0) setSelectedInv(list[0].id);
    }).catch(err => { if (err.response?.status === 403) setNoPlan(true); })
      .finally(() => setLoadingInvitations(false));
  }, []);

  // ── Load guests + stats + groups ────────────────────────────────
  const load = useCallback(async () => {
    if (!selectedInv) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '500');
      if (filterStatus)    params.set('status', filterStatus);
      if (filterGroup)     params.set('group_name', filterGroup);
      if (filterHasEmail)  params.set('has_email', filterHasEmail);
      if (filterHasPhone)  params.set('has_phone', filterHasPhone);
      if (filterCheckedIn) params.set('checked_in', filterCheckedIn);
      if (filterHasTable)  params.set('has_table', filterHasTable);
      if (filterSent)      params.set('sent', filterSent);
      params.set('sort_by', sortBy);
      params.set('sort_dir', sortDir);

      const [gRes, sRes, grRes] = await Promise.all([
        api.get(`/guests/invitation/${selectedInv}?${params.toString()}`),
        api.get(`/guests/invitation/${selectedInv}/stats`),
        api.get(`/guests/invitation/${selectedInv}/groups`),
      ]);
      setGuests(gRes.data.data?.data || []);
      setStats(sRes.data.data);
      setGroups(grRes.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al cargar invitados' });
    } finally {
      setLoading(false);
      setSelectedIds(new Set());
    }
  }, [selectedInv, filterStatus, filterGroup, filterHasEmail, filterHasPhone, filterCheckedIn, filterHasTable, filterSent, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  // ── Derived ─────────────────────────────────────────────────────
  const currentInvitation = invitations.find(i => i.id === selectedInv);
  const invSlug           = currentInvitation?.slug;
  const invTitle          = currentInvitation?.title || 'Evento';

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return guests;
    return guests.filter(g =>
      g.name.toLowerCase().includes(s) ||
      (g.email || '').toLowerCase().includes(s) ||
      (g.phone || '').toLowerCase().includes(s) ||
      (g.group_name || '').toLowerCase().includes(s)
    );
  }, [guests, search]);

  const allSelected = filtered.length > 0 && filtered.every(g => selectedIds.has(g.id));
  const someSelected = filtered.some(g => selectedIds.has(g.id));

  // ── Actions ─────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (allSelected) return new Set();
      return new Set(filtered.map(g => g.id));
    });
  };
  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const handleDelete = (guest) => {
    setConfirm({
      title: 'Eliminar invitado',
      message: `¿Eliminar a "${guest.name}"? Esta acción no se puede deshacer.`,
      danger: true,
      confirmText: 'Eliminar',
      action: async () => {
        try {
          await api.delete(`/guests/${guest.id}`);
          setGuests(prev => prev.filter(g => g.id !== guest.id));
          toast({ title: 'Invitado eliminado' });
          load();
        } catch (err) { toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message }); }
      },
    });
  };

  const handleCheckIn = async (guest) => {
    try {
      const { data } = await api.patch(`/guests/${guest.id}/check-in`, {
        checked_in: !guest.checked_in,
      });
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, ...data.data } : g));
      toast({ title: !guest.checked_in ? 'Check-in registrado' : 'Check-in revertido' });
    } catch (err) { toast({ variant: 'destructive', title: 'Error' }); }
  };

  const markSentLocally = (guest) => {
    setGuests(prev => prev.map(g =>
      g.id === guest.id ? { ...g, invitation_sent_at: new Date().toISOString() } : g
    ));
  };

  const setSent = async (guest, sent) => {
    try {
      const { data } = await api.patch(`/guests/${guest.id}/sent`, { sent });
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, ...data.data } : g));
      toast({ title: sent ? 'Marcada como enviada' : 'Marcada como no enviada' });
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo actualizar' });
    }
  };

  const autoMarkSentIfNeeded = async (guest) => {
    if (guest.invitation_sent_at) return; // already sent
    markSentLocally(guest);
    try { await api.patch(`/guests/${guest.id}/sent`, { sent: true }); }
    catch { /* optimistic; silent failure */ }
  };

  const handleCopyLink = async (guest) => {
    const link = buildGuestLink(invSlug, guest.id);
    try { await navigator.clipboard.writeText(link); toast({ title: 'Link copiado', description: link }); }
    catch { toast({ variant: 'destructive', title: 'No se pudo copiar' }); }
    autoMarkSentIfNeeded(guest);
  };

  const handleBulkAction = (action, actionLabel) => {
    if (!selectedIds.size) return;
    const ids = Array.from(selectedIds);
    setConfirm({
      title: `${actionLabel} ${ids.length} invitados`,
      message: action === 'delete'
        ? '¿Eliminar todos los seleccionados? Esta acción no se puede deshacer.'
        : `¿Aplicar "${actionLabel}" a ${ids.length} invitados?`,
      danger: action === 'delete',
      confirmText: actionLabel,
      action: async () => {
        try {
          const { data } = await api.post('/guests/bulk-action', { ids, action });
          toast({ title: `${data.data.affected} actualizados` });
          setSelectedIds(new Set());
          load();
        } catch (err) {
          toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
        }
      },
    });
  };

  const handleExportCsv = () => {
    if (!selectedInv) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Simple: trigger fetch with token, download blob
    fetch(`${API_URL}/api/v1/guests/invitation/${selectedInv}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invitados-${invTitle.replace(/\s+/g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast({ variant: 'destructive', title: 'No se pudo exportar' }));
  };

  // ── Render ──────────────────────────────────────────────────────
  if (noPlan) return <NoPlanBanner description="Tu plan no tiene permiso para usar este módulo o aún no cuentas con un plan activo. Elige un plan para gestionar invitados." />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invitados</h1>
          <p className="text-gray-500 mt-1">Gestiona tu lista, confirmaciones, mesas y check-in</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowAnalytics(v => !v)}>
            <TrendingUp className="w-4 h-4 mr-2" /> {showAnalytics ? 'Ocultar' : 'Analíticas'}
          </Button>
          <Button variant="outline" onClick={handleExportCsv} disabled={!selectedInv}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)} disabled={!selectedInv}>
            <Upload className="w-4 h-4 mr-2" /> Importar
          </Button>
          <Button variant="outline" onClick={() => setShowCheckIn(true)} disabled={!selectedInv || !guests.length}>
            <UserCheck className="w-4 h-4 mr-2" /> Check-in
          </Button>
          <Button onClick={() => { setEditGuest(null); setShowForm(true); }} disabled={!selectedInv}>
            <Plus className="w-4 h-4 mr-2" /> Agregar
          </Button>
        </div>
      </div>

      {/* Invitation selector */}
      <div className="flex items-center gap-4">
        <Label className="flex-shrink-0">Invitación:</Label>
        {loadingInvitations ? (
          <div className="h-10 w-64 bg-gray-100 rounded-md animate-pulse" />
        ) : invitations.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
            <span>No tienes invitaciones creadas.</span>
            <a href="/dashboard/invitations" className="underline font-medium">Crear una</a>
          </div>
        ) : (
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm flex-1 max-w-sm"
            value={selectedInv}
            onChange={e => setSelectedInv(e.target.value)}
          >
            {invitations.map(inv => (
              <option key={inv.id} value={inv.id}>{inv.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total',        value: stats.total,           color: 'bg-gray-100 text-gray-700' },
            { label: 'Confirmados',  value: stats.confirmed,       color: 'bg-green-100 text-green-700' },
            { label: 'Declinaron',   value: stats.declined,        color: 'bg-red-100 text-red-700' },
            { label: 'Pendientes',   value: stats.pending,         color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Pases conf.',  value: stats.confirmed_seats, color: 'bg-blue-100 text-blue-700',    sub: `de ${stats.total_seats}` },
            { label: 'Check-in',     value: stats.checked_in,      color: 'bg-purple-100 text-purple-700' },
          ].map(({ label, value, color, sub }) => (
            <Card key={label}>
              <CardContent className={`p-3 rounded-lg ${color}`}>
                <p className="text-2xl font-bold leading-tight">{value}</p>
                <p className="text-xs font-medium">{label}</p>
                {sub && <p className="text-[10px] opacity-70">{sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response rate bar */}
      {stats && stats.total > 0 && (
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Tasa de respuesta</span>
            <span className="font-semibold">{stats.response_rate}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-green-500" style={{ width: `${stats.total ? (stats.confirmed / stats.total) * 100 : 0}%` }} />
            <div className="bg-red-500"   style={{ width: `${stats.total ? (stats.declined  / stats.total) * 100 : 0}%` }} />
            <div className="bg-yellow-400" style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Analytics */}
      {showAnalytics && selectedInv && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Evolución de confirmaciones</CardTitle></CardHeader>
          <CardContent>
            <TimelineChart invitationId={selectedInv} />
            {groups.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Por grupo</p>
                <div className="flex flex-wrap gap-2">
                  {groups.map(g => (
                    <div key={g.group_name} className="text-xs bg-gray-50 border rounded-md px-3 py-1.5">
                      <span className="font-medium">{g.group_name}</span>
                      <span className="text-gray-500"> · {g.confirmed}/{g.count} conf. · {g.total_seats} pases</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guest list */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar invitado..." className="pl-9" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
              <Filter className="w-4 h-4 mr-1" /> Filtros
              {(filterStatus || filterGroup || filterHasEmail || filterHasPhone || filterCheckedIn || filterHasTable || filterSent) &&
                <Badge variant="secondary" className="ml-2">•</Badge>}
            </Button>
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} de {guests.length} invitados
            </span>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2 border-t">
              <select className="h-9 text-sm rounded-md border px-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="confirmed">Confirmados</option>
                <option value="declined">Declinaron</option>
                <option value="pending">Pendientes</option>
              </select>
              <select className="h-9 text-sm rounded-md border px-2" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                <option value="">Todos los grupos</option>
                {groups.map(g => <option key={g.group_name} value={g.group_name}>{g.group_name}</option>)}
              </select>
              <select className="h-9 text-sm rounded-md border px-2" value={filterSent} onChange={e => setFilterSent(e.target.value)}>
                <option value="">Invitación (todos)</option>
                <option value="true">Enviada</option>
                <option value="false">No enviada</option>
              </select>
              <select className="h-9 text-sm rounded-md border px-2" value={filterHasEmail} onChange={e => setFilterHasEmail(e.target.value)}>
                <option value="">Email (todos)</option>
                <option value="true">Con email</option>
                <option value="false">Sin email</option>
              </select>
              <select className="h-9 text-sm rounded-md border px-2" value={filterHasPhone} onChange={e => setFilterHasPhone(e.target.value)}>
                <option value="">Teléfono (todos)</option>
                <option value="true">Con teléfono</option>
                <option value="false">Sin teléfono</option>
              </select>
              <select className="h-9 text-sm rounded-md border px-2" value={filterCheckedIn} onChange={e => setFilterCheckedIn(e.target.value)}>
                <option value="">Check-in (todos)</option>
                <option value="true">Registrados</option>
                <option value="false">No registrados</option>
              </select>
              <select className="h-9 text-sm rounded-md border px-2" value={filterHasTable} onChange={e => setFilterHasTable(e.target.value)}>
                <option value="">Mesa (todos)</option>
                <option value="true">Con mesa</option>
                <option value="false">Sin mesa</option>
              </select>
            </div>
          )}

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm flex-wrap">
              <span className="font-medium text-blue-900">{selectedIds.size} seleccionados</span>
              <div className="flex gap-1 ml-auto flex-wrap">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('confirm', 'Confirmar')}>Confirmar</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('decline', 'Declinar')}>Declinar</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('reset', 'Reiniciar')}>Reiniciar</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('check_in', 'Check-in')}>Check-in</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('check_out', 'Check-out')}>Check-out</Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleBulkAction('delete', 'Eliminar')}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay invitados que coincidan</p>
              <Button
                className="mt-3" size="sm"
                onClick={() => { setEditGuest(null); setShowForm(true); }}
                disabled={!selectedInv}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar invitado
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[1100px] text-sm [&_th]:px-2 [&_td]:px-2 [&_th:first-child]:pl-0 [&_td:first-child]:pl-0 [&_th:last-child]:pr-0 [&_td:last-child]:pr-0">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-2 w-8">
                      <input type="checkbox" checked={allSelected}
                        ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }}
                        onChange={toggleSelectAll} />
                    </th>
                    <SortHeader label="Nombre"  col="name"        sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Grupo"   col="group_name"  sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
                    <th className="pb-3 font-medium">Contacto</th>
                    <SortHeader label="Pases"   col="party_size"  sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Mesa"    col="table_number" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Estado"  col="status"      sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
                    <th className="pb-3 font-medium">Check-in</th>
                    <th className="pb-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(guest => {
                    const status = statusConfig[guest.status] || statusConfig.pending;
                    const Icon = status.icon;
                    const link = buildGuestLink(invSlug, guest.id);
                    const waUrl = buildWhatsAppUrl(guest.phone, defaultWhatsAppMessage({ name: guest.name, eventTitle: invTitle, link }));
                    const isSelected = selectedIds.has(guest.id);

                    return (
                      <tr key={guest.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50/60' : ''}`}>
                        <td className="py-3 pr-2">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(guest.id)} />
                        </td>
                        <td className="py-3">
                          <div className="font-medium">{guest.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {guest.invitation_sent_at && (
                              <span title={`Invitación enviada el ${new Date(guest.invitation_sent_at).toLocaleDateString()}`}
                                className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 rounded px-1.5 py-0.5">
                                <Send className="w-3 h-3" /> enviada
                              </span>
                            )}
                            {guest.dietary_restrictions && (
                              <span title={guest.dietary_restrictions}
                                className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 rounded px-1.5 py-0.5">
                                <UtensilsCrossed className="w-3 h-3" /> dieta
                              </span>
                            )}
                            {guest.notes && (
                              <span title={guest.notes}
                                className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                                <StickyNote className="w-3 h-3" /> nota
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground whitespace-nowrap">
                          {guest.group_name || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 text-muted-foreground whitespace-nowrap">
                          <div className="text-xs">{guest.email || '—'}</div>
                          <div className="text-xs">{guest.phone || ''}</div>
                        </td>
                        <td className="py-3 text-center">{guest.party_size || 1}</td>
                        <td className="py-3 whitespace-nowrap">
                          {guest.table_number != null ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 ${
                                guest.is_bride_table
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                              title={guest.is_bride_table ? 'Mesa de novios' : 'Mesa asignada'}
                            >
                              <LayoutGrid className="w-3 h-3" />
                              Mesa {guest.table_number}
                              {guest.seat_index != null && (
                                <span className="opacity-70">· <Armchair className="w-3 h-3 inline" /> {guest.seat_index + 1}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <Icon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                          {guest.rsvp_message && (
                            <p className="text-xs text-muted-foreground mt-1 italic max-w-[200px] truncate"
                               title={guest.rsvp_message}>
                              &ldquo;{guest.rsvp_message}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleCheckIn(guest)}
                            className={`text-xs px-2 py-1 rounded ${
                              guest.checked_in
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {guest.checked_in ? '✓ Dentro' : 'Marcar'}
                          </button>
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <button
                            onClick={(evt) => openRowMenu(guest, evt)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <GuestFormModal
        open={showForm}
        guest={editGuest}
        invitationId={selectedInv}
        groups={groups}
        onClose={() => { setShowForm(false); setEditGuest(null); }}
        onSaved={() => load()}
      />
      <ImportModal
        open={showImport}
        invitationId={selectedInv}
        onClose={() => setShowImport(false)}
        onImported={() => load()}
      />
      <QRModal
        open={!!qrGuest}
        guest={qrGuest}
        link={qrGuest ? buildGuestLink(invSlug, qrGuest.id) : ''}
        eventTitle={invTitle}
        onClose={() => setQrGuest(null)}
        onMarkSent={autoMarkSentIfNeeded}
      />
      <CheckInMode
        open={showCheckIn}
        guests={guests}
        onClose={() => { setShowCheckIn(false); load(); }}
        onChanged={(g) => setGuests(prev => prev.map(x => x.id === g.id ? { ...x, ...g } : x))}
      />
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        confirmText={confirm?.confirmText}
        onConfirm={() => confirm?.action?.()}
        onClose={() => setConfirm(null)}
      />

      {/* Row action menu portal — sits above the table, escapes overflow */}
      {rowMenu && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setRowMenu(null)} />
          <div
            className="fixed z-[61] bg-white border rounded-lg shadow-lg w-48 py-1 text-sm max-h-[85vh] overflow-y-auto"
            style={{ top: rowMenu.top, bottom: rowMenu.bottom, right: rowMenu.right }}
            onClick={e => e.stopPropagation()}
          >
            <MenuItem icon={Edit2} label="Editar"
              onClick={() => { setEditGuest(rowMenu.guest); setShowForm(true); setRowMenu(null); }} />
            <MenuItem icon={Copy} label="Copiar link RSVP"
              disabled={!invSlug}
              onClick={() => { handleCopyLink(rowMenu.guest); setRowMenu(null); }} />
            <MenuItem icon={QrCode} label="Ver QR"
              disabled={!invSlug}
              onClick={() => { setQrGuest(rowMenu.guest); setRowMenu(null); }} />
            {rowMenu.guest.phone && (
              <a
                href={buildWhatsAppUrl(
                  rowMenu.guest.phone,
                  defaultWhatsAppMessage({
                    name: rowMenu.guest.name,
                    eventTitle: invTitle,
                    link: buildGuestLink(invSlug, rowMenu.guest.id),
                  })
                )}
                target="_blank" rel="noreferrer" className="block"
                onClick={() => {
                  autoMarkSentIfNeeded(rowMenu.guest);
                  setRowMenu(null);
                }}
              >
                <MenuItem icon={MessageCircle} label="Enviar WhatsApp"
                  className="text-green-700" />
              </a>
            )}
            <div className="border-t my-1" />
            <MenuItem 
              icon={rowMenu.guest.invitation_sent_at ? MailX : MailCheck} 
              label={rowMenu.guest.invitation_sent_at ? "Marcar como no enviada" : "Marcar como enviada"}
              onClick={() => { 
                setSent(rowMenu.guest, !rowMenu.guest.invitation_sent_at); 
                setRowMenu(null); 
              }} 
            />
            <MenuItem icon={RefreshCw} label="Reiniciar RSVP"
              onClick={() => {
                api.put(`/guests/${rowMenu.guest.id}`, { status: 'pending' })
                  .then(() => { toast({ title: 'RSVP reiniciado' }); load(); })
                  .catch(() => toast({ variant: 'destructive', title: 'Error' }));
                setRowMenu(null);
              }} />
            <MenuItem icon={Trash2} label="Eliminar" className="text-red-600"
              onClick={() => { handleDelete(rowMenu.guest); setRowMenu(null); }} />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function SortHeader({ label, col, sortBy, sortDir, onClick }) {
  const active = sortBy === col;
  return (
    <th className="pb-3 font-medium">
      <button onClick={() => onClick(col)} className="inline-flex items-center gap-1 hover:text-gray-900">
        {label}
        {active && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}

function MenuItem({ icon: Icon, label, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
