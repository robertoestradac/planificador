'use client';
import { useEffect, useState } from 'react';
import { Plus, Users, Search, CheckCircle, XCircle, Clock, Upload, Trash2 } from 'lucide-react';
import NoPlanBanner from '@/components/ui/no-plan-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { toast } from '@/hooks/use-toast';

const statusConfig = {
  confirmed: { label: 'Confirmado', variant: 'success', icon: CheckCircle },
  declined:  { label: 'Declinó',    variant: 'destructive', icon: XCircle },
  pending:   { label: 'Pendiente',  variant: 'secondary', icon: Clock },
};

export default function GuestsPage() {
  const [invitations, setInvitations] = useState([]);
  const [selectedInv, setSelectedInv] = useState('');
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [noPlan, setNoPlan]   = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dataCache.fetchers.invitations().then(list => {
      setInvitations(list);
      if (list.length > 0) setSelectedInv(list[0].id);
    }).catch(err => { if (err.response?.status === 403) setNoPlan(true); })
      .finally(() => setLoadingInvitations(false));
  }, []);

  useEffect(() => {
    if (!selectedInv) return;
    setLoading(true);
    Promise.all([
      api.get(`/guests/invitation/${selectedInv}`),
      api.get(`/guests/invitation/${selectedInv}/stats`),
    ])
      .then(([gRes, sRes]) => {
        setGuests(gRes.data.data?.data || []);
        setStats(sRes.data.data);
      })
      .catch(() => toast({ variant: 'destructive', title: 'Error al cargar invitados' }))
      .finally(() => setLoading(false));
  }, [selectedInv]);

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!selectedInv) {
      toast({ variant: 'destructive', title: 'Selecciona una invitación primero' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/guests', { ...form, invitation_id: selectedInv });
      toast({ title: 'Invitado agregado' });
      setForm({ name: '', phone: '', email: '' });
      setShowForm(false);
      // Refresh
      const [gRes, sRes] = await Promise.all([
        api.get(`/guests/invitation/${selectedInv}`),
        api.get(`/guests/invitation/${selectedInv}/stats`),
      ]);
      setGuests(gRes.data.data?.data || []);
      setStats(sRes.data.data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este invitado?')) return;
    try {
      await api.delete(`/guests/${id}`);
      setGuests(prev => prev.filter(g => g.id !== id));
      toast({ title: 'Invitado eliminado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (noPlan) return <NoPlanBanner description="Tu plan no tiene permiso para usar este módulo o aún no cuentas con un plan activo. Elige un plan para gestionar invitados." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invitados</h1>
          <p className="text-gray-500 mt-1">Gestiona tu lista de invitados y confirmaciones</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={!selectedInv}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Invitado
        </Button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'Confirmados', value: stats.confirmed, color: 'bg-green-100 text-green-700' },
            { label: 'Declinaron', value: stats.declined, color: 'bg-red-100 text-red-700' },
            { label: 'Pendientes', value: stats.pending, color: 'bg-yellow-100 text-yellow-700' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className={`p-4 rounded-lg ${color}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add guest form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Agregar Invitado</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddGuest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Juan Pérez" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+502 1234 5678" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="juan@email.com" />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Guest list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar invitado..." className="pl-9" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} invitados</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay invitados aún</p>
              <Button className="mt-3" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Agregar invitado
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Contacto</th>
                    <th className="pb-3 font-medium">Estado RSVP</th>
                    <th className="pb-3 font-medium">ID Invitado</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(guest => {
                    const status = statusConfig[guest.status] || statusConfig.pending;
                    const Icon = status.icon;
                    return (
                      <tr key={guest.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium">{guest.name}</td>
                        <td className="py-3 text-muted-foreground">
                          <div>{guest.email || '—'}</div>
                          <div className="text-xs">{guest.phone || ''}</div>
                        </td>
                        <td className="py-3">
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <Icon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                          {guest.rsvp_response && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Resp: {guest.rsvp_response}
                            </p>
                          )}
                        </td>
                        <td className="py-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {guest.id.slice(0, 8)}...
                          </code>
                        </td>
                        <td className="py-3">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600"
                            onClick={() => handleDelete(guest.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
    </div>
  );
}
