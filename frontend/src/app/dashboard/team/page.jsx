'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Users, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useConfirm } from '@/hooks/use-confirm';

const statusVariant = { active: 'success', inactive: 'secondary', suspended: 'destructive' };

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [limitAlert, setLimitAlert] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);
  const confirm = useConfirm();

  const fetchData = async () => {
    try {
      const usersData = await dataCache.fetchers.users();
      setUsers(usersData);
    } catch { toast({ variant: 'destructive', title: 'Error al cargar equipo' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Verificar creditos antes de abrir el formulario
  const handleAddUser = async () => {
    try {
      const { data } = await api.get('/payments/my/credits');
      const credits = data.data;
      if (credits && credits.users.available !== null && credits.users.available <= 0) {
        setCreditInfo(credits.users);
        setLimitAlert(true);
        return;
      }
    } catch {}
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast({ title: 'Usuario creado', description: `${form.name} fue agregado al equipo` });
      setShowForm(false);
      setForm({ name: '', email: '', password: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear usuario';
      const isLimit = err.response?.status === 403;
      toast({
        variant: 'destructive',
        title: isLimit ? 'Limite de usuarios alcanzado' : 'Error',
        description: isLimit ? 'Tu plan no permite mas usuarios. Ve a Mi Plan para ampliar.' : msg,
      });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: 'Eliminar usuario?',
      message: `Estas seguro de eliminar a "${name}" del equipo? Esta accion no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (!confirmed) return;

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
        <Button onClick={handleAddUser}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Usuario
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Nuevo Usuario</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Juan Perez" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="juan@empresa.com" />
              </div>
              <div>
                <Label>Contrasena</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Minimo 8 caracteres" minLength={8} />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear usuario'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
            <p className="text-xs text-gray-400 mt-3">El usuario se creara con el rol de Colaborador (Member). Podra ver y editar eventos e invitaciones.</p>
          </CardContent>
        </Card>
      )}

      {/* Alert de limite */}
      <ConfirmDialog
        open={limitAlert}
        onOpenChange={setLimitAlert}
        variant="warning"
        title="Limite de usuarios alcanzado"
        message={
          creditInfo
            ? `Has usado ${creditInfo.used} de ${creditInfo.total} usuarios disponibles en tu plan. Para agregar mas miembros al equipo, adquiere un nuevo plan.`
            : 'No puedes agregar mas usuarios con tu plan actual.'
        }
        confirmText="Ir a Mi Plan"
        cancelText="Cerrar"
        onConfirm={() => { window.location.href = '/dashboard/subscription'; }}
      />

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
                          onClick={() => handleDelete(user.id, user.name)}>
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
