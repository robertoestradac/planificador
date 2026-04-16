'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Shield, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function AdminRolesPage() {
  const [roles, setRoles]               = useState([]);
  const [grouped, setGrouped]           = useState([]); // permissions grouped by module
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ name: '', is_global: 1 });
  const [saving, setSaving]             = useState(false);
  const [editingRole, setEditingRole]   = useState(null); // role being edited permissions
  const [rolePerms, setRolePerms]       = useState({}); // { roleId: Set<permId> }
  const [savingPerms, setSavingPerms]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [rolesRes, groupedRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions/grouped'),
      ]);
      setRoles(rolesRes.data.data || []);
      setGrouped(groupedRes.data.data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar roles' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/roles', form);
      toast({ title: 'Rol creado' });
      setShowForm(false);
      setForm({ name: '', is_global: 1 });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar el rol "${name}"?`)) return;
    try {
      await api.delete(`/roles/${id}`);
      toast({ title: 'Rol eliminado' });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const openPermissions = async (role) => {
    if (editingRole?.id === role.id) { setEditingRole(null); return; }
    try {
      const { data } = await api.get(`/roles/${role.id}/permissions`);
      const permSet = new Set((data.data || []).map(p => p.id));
      setRolePerms(prev => ({ ...prev, [role.id]: permSet }));
      setEditingRole(role);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar permisos del rol' });
    }
  };

  const togglePerm = (roleId, permId) => {
    setRolePerms(prev => {
      const set = new Set(prev[roleId] || []);
      set.has(permId) ? set.delete(permId) : set.add(permId);
      return { ...prev, [roleId]: set };
    });
  };

  const toggleModule = (roleId, modulePerms) => {
    setRolePerms(prev => {
      const set = new Set(prev[roleId] || []);
      const allSelected = modulePerms.every(p => set.has(p.id));
      modulePerms.forEach(p => allSelected ? set.delete(p.id) : set.add(p.id));
      return { ...prev, [roleId]: set };
    });
  };

  const savePermissions = async (roleId) => {
    setSavingPerms(true);
    try {
      const permIds = Array.from(rolePerms[roleId] || []);
      await api.put(`/roles/${roleId}/permissions`, { permission_ids: permIds });
      toast({ title: 'Permisos guardados' });
      setEditingRole(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSavingPerms(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-500 mt-1">Gestiona los roles y sus permisos por módulo</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Rol
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre del rol</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ej: Contador, Diseñador, Ventas..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tipo</label>
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.is_global}
                  onChange={e => setForm({ ...form, is_global: parseInt(e.target.value) })}
                >
                  <option value={1}>Global (staff SaaS)</option>
                  <option value={0}>Tenant (cliente)</option>
                </select>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {roles.map(role => {
          const isEditing = editingRole?.id === role.id;
          const currentPerms = rolePerms[role.id] || new Set();

          return (
            <Card key={role.id} className={isEditing ? 'ring-2 ring-violet-400' : ''}>
              <CardContent className="p-0">
                {/* Role header */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{role.name}</p>
                      <Badge variant={role.is_global ? 'default' : 'secondary'}>
                        {role.is_global ? 'Global' : 'Tenant'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPermissions(role)}>
                      {isEditing ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      Permisos
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="text-red-400 hover:text-red-600"
                      onClick={() => handleDelete(role.id, role.name)}
                    >
                      <Trash2 className="w-4 h-4" />
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
                          {/* Module header with select-all */}
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => toggleModule(role.id, permissions)}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                allChecked ? 'bg-violet-600 border-violet-600' : someChecked ? 'bg-violet-200 border-violet-400' : 'border-gray-300'
                              }`}
                            >
                              {(allChecked || someChecked) && <Check className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{module}</span>
                          </div>
                          {/* Individual permissions */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-6">
                            {permissions.map(perm => (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                                <button
                                  onClick={() => togglePerm(role.id, perm.id)}
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
                      <Button size="sm" onClick={() => savePermissions(role.id)} disabled={savingPerms}>
                        {savingPerms ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Guardar permisos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>Cancelar</Button>
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
