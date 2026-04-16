'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Users, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const statusVariant = { active: 'success', inactive: 'secondary', suspended: 'destructive' };

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      // Carga desde cache (instantáneo si hubo prefetch en hover)
      const [usersData, rolesData] = await Promise.all([
        dataCache.fetchers.users(),
        dataCache.fetchers.roles(),
      ]);
      setUsers(usersData);
      setRoles((rolesData || []).filter(r => !r.is_global));
    } catch { toast({ variant: 'destructive', title: 'Error al cargar equipo' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast({ title: 'Usuario creado', description: `${form.name} fue agregado al equipo` });
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role_id: '' });
      fetchData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario del equipo?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast({ title: 'Usuario eliminado' });
      fetchData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipo</h1>
          <p className="text-gray-500 mt-1">Administra los usuarios de tu cuenta</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Usuario
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Nuevo Usuario</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Juan Pérez" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="juan@empresa.com" />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <Label>Rol</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role_id}
                  onChange={e => setForm({ ...form, role_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear usuario'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar usuario..." className="pl-9" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} usuarios</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay usuarios en tu equipo aún</p>
              <Button className="mt-3" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Agregar usuario
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Usuario</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Creado</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
                          <span>{user.role_name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant={statusVariant[user.status] || 'secondary'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(user.created_at)}</td>
                      <td className="py-3">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600"
                          onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
