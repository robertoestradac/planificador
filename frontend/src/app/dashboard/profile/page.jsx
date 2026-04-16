'use client';
import { useState, useEffect } from 'react';
import { Loader2, Save, KeyRound, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';

export default function ProfilePage() {
  const user      = useAuthStore((s) => s.user);
  const fetchMe   = useAuthStore((s) => s.fetchMe);

  const [profile, setProfile]   = useState({ name: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [showPwd, setShowPwd]     = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put(`/users/${user.id}`, { name: profile.name, email: profile.email });
      await fetchMe();
      toast({ title: 'Perfil actualizado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'No se pudo actualizar el perfil' });
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas no coinciden' });
      return;
    }
    setSavingPwd(true);
    try {
      await api.patch('/users/me/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: '', new_password: '', confirm: '' });
      toast({ title: 'Contraseña actualizada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'No se pudo cambiar la contraseña' });
    } finally { setSavingPwd(false); }
  };

  const toggle = (field) => setShowPwd((v) => ({ ...v, [field]: !v[field] }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Administra tu información personal</p>
      </div>

      {/* Avatar + name header */}
      <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200">
        <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{user?.role}</span>
        </div>
      </div>

      {/* Profile form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-violet-600" /> Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                className="mt-1"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                required
                minLength={2}
              />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input
                className="mt-1"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto">
              {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar cambios</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-violet-600" /> Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordField
              label="Contraseña actual"
              value={passwords.current_password}
              show={showPwd.current}
              onToggle={() => toggle('current')}
              onChange={(v) => setPasswords((p) => ({ ...p, current_password: v }))}
            />
            <PasswordField
              label="Nueva contraseña"
              value={passwords.new_password}
              show={showPwd.new}
              onToggle={() => toggle('new')}
              onChange={(v) => setPasswords((p) => ({ ...p, new_password: v }))}
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
            <PasswordField
              label="Confirmar nueva contraseña"
              value={passwords.confirm}
              show={showPwd.confirm}
              onToggle={() => toggle('confirm')}
              onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
              minLength={8}
            />
            <Button type="submit" disabled={savingPwd} variant="outline" className="w-full sm:w-auto">
              {savingPwd ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Actualizando...</> : <><KeyRound className="w-4 h-4 mr-2" />Cambiar contraseña</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordField({ label, value, show, onToggle, onChange, minLength, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 016.375 2.325M15 12a3 3 0 11-6 0 3 3 0 016 0zm4.5 4.5L4.5 4.5" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
