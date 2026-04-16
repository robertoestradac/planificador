'use client';
import { useEffect, useState } from 'react';
import { Plus, Shield, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const emptyForm = { key_name: '', description: '' };

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    try {
      const { data } = await api.get('/permissions');
      setPermissions(data.data || []);
    } catch { toast({ variant: 'destructive', title: 'Error al cargar permisos' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPermissions(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/permissions/${editId}`, form);
        toast({ title: 'Permiso actualizado' });
      } else {
        await api.post('/permissions', form);
        toast({ title: 'Permiso creado' });
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      fetchPermissions();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setForm({ key_name: p.key_name, description: p.description });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este permiso? Esto puede afectar roles y planes.')) return;
    try {
      await api.delete(`/permissions/${id}`);
      toast({ title: 'Permiso eliminado' });
      fetchPermissions();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permisos</h1>
          <p className="text-gray-500 mt-1">Gestiona los permisos del sistema RBAC</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Permiso
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? 'Editar Permiso' : 'Nuevo Permiso'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Clave (key_name)</Label>
                <Input
                  value={form.key_name}
                  onChange={e => setForm({ ...form, key_name: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                  required
                  placeholder="create_event"
                  disabled={!!editId}
                />
                <p className="text-xs text-muted-foreground mt-1">Solo letras minúsculas y guiones bajos</p>
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  placeholder="Crear eventos"
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Clave</th>
                  <th className="px-6 py-4 font-medium">Descripción</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {permissions.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-violet-700">
                          {p.key_name}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{p.description}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {permissions.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">No hay permisos registrados</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
