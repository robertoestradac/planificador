'use client';
import { useEffect, useState } from 'react';
import { Plus, Calendar, MapPin, Pencil, Trash2, ChevronRight } from 'lucide-react';
import NoPlanBanner from '@/components/ui/no-plan-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

const emptyForm = { name: '', date: '', location: '', map_url: '' };

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noPlan, setNoPlan]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await dataCache.fetchers.events();
      setEvents(data);
    } catch (err) {
      if (err.response?.status === 403) setNoPlan(true);
      else toast({ variant: 'destructive', title: 'Error al cargar eventos' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const { data } = await api.put(`/events/${editId}`, form);
        toast({ title: 'Evento actualizado' });
        // Actualiza solo el evento modificado en el estado local
        setEvents(prev => prev.map(ev => ev.id === editId ? data.data : ev));
      } else {
        const { data } = await api.post('/events', form);
        toast({ title: 'Evento creado' });
        // Agrega el nuevo evento al inicio del estado local
        setEvents(prev => [data.data, ...prev]);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleEdit = (event) => {
    setForm({
      name: event.name,
      date: event.date?.slice(0, 16),
      location: event.location || '',
      map_url: event.map_url || '',
    });
    setEditId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast({ title: 'Evento eliminado' });
      // Filtra el evento eliminado del estado local
      setEvents(prev => prev.filter(ev => ev.id !== id));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  if (noPlan) return <NoPlanBanner description="Tu plan no tiene permiso para usar este módulo o aún no cuentas con un plan activo. Elige un plan para crear eventos." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500 mt-1">Gestiona tus eventos</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Evento
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? 'Editar Evento' : 'Crear Evento'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nombre del evento</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Boda de Ana y Carlos" />
              </div>
              <div>
                <Label>Fecha y hora</Label>
                <Input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <Label>Ubicación</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Salón de eventos XYZ" />
              </div>
              <div className="md:col-span-2">
                <Label>URL del mapa (opcional)</Label>
                <Input value={form.map_url} onChange={e => setForm({ ...form, map_url: e.target.value })} placeholder="https://maps.google.com/..." />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Card key={i}><CardContent className="h-40 animate-pulse bg-gray-100 rounded-lg m-4" /></Card>)}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No tienes eventos aún</p>
            <p className="text-gray-400 text-sm mt-1">Crea tu primer evento para comenzar</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Crear evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(event)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{event.name}</h3>
                <p className="text-sm text-gray-500 mb-1">{formatDateTime(event.date)}</p>
                {event.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
                <Link href={`/dashboard/invitations?event_id=${event.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Ver invitaciones <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
