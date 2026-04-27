'use client';
import { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, AlertCircle, Loader2, KeyRound, User, Mail, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DashboardSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('2fa');

  /* ── 2FA state ── */
  const [twofa, setTwofa] = useState({ enabled: false, loading: true, qr: null, secret: null, code: '', step: 'idle' });

  /* ── Password state ── */
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (activeTab !== '2fa' || !twofa.loading) return;
    api.get('/auth/2fa/status')
      .then(r => setTwofa(p => ({ ...p, enabled: r.data.data.enabled, loading: false })))
      .catch(() => setTwofa(p => ({ ...p, loading: false })));
  }, [activeTab]);

  const handle2FASetup = async () => {
    setTwofa(p => ({ ...p, step: 'loading' }));
    try {
      const r = await api.post('/auth/2fa/setup');
      setTwofa(p => ({ ...p, qr: r.data.data.qr, secret: r.data.data.secret, step: 'scan', code: '' }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
      setTwofa(p => ({ ...p, step: 'idle' }));
    }
  };

  const handle2FAEnable = async () => {
    try {
      await api.post('/auth/2fa/enable', { code: twofa.code });
      setTwofa(p => ({ ...p, enabled: true, step: 'idle', qr: null, secret: null, code: '' }));
      toast({ title: '2FA activado', description: 'Tu cuenta ahora está protegida con autenticación de dos pasos.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Código incorrecto', description: err.response?.data?.message });
    }
  };

  const handle2FADisable = async () => {
    try {
      await api.post('/auth/2fa/disable', { code: twofa.code });
      setTwofa(p => ({ ...p, enabled: false, step: 'idle', code: '' }));
      toast({ title: '2FA desactivado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Código incorrecto', description: err.response?.data?.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) return toast({ variant: 'destructive', title: 'Las contraseñas no coinciden' });
    if (pwd.next.length < 8) return toast({ variant: 'destructive', title: 'La contraseña debe tener al menos 8 caracteres' });
    setSavingPwd(true);
    try {
      await api.put('/users/me/password', { current_password: pwd.current, new_password: pwd.next });
      setPwd({ current: '', next: '', confirm: '' });
      toast({ title: 'Contraseña actualizada correctamente' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Contraseña actual incorrecta' });
    } finally { setSavingPwd(false); }
  };

  const TABS = [
    { id: '2fa',      label: 'Seguridad 2FA',   icon: ShieldAlert },
    { id: 'password', label: 'Contraseña',       icon: Lock },
    { id: 'profile',  label: 'Mi perfil',        icon: User },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seguridad de cuenta</h1>
            <p className="text-sm text-gray-500">Gestiona tu contraseña y autenticación de dos pasos</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              <Icon className={cn('w-4 h-4', activeTab === id ? 'text-violet-500' : 'text-gray-400')} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2FA TAB ── */}
      {activeTab === '2fa' && (
        <div className="space-y-6">
          {twofa.loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-500" /></div>
          ) : (
            <>
              <Card title="Autenticación de dos pasos (2FA)" icon={<ShieldAlert className="w-4 h-4" />}>
                <div className="flex items-start gap-4 mb-5">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                    twofa.enabled ? 'bg-green-100' : 'bg-gray-100')}>
                    <ShieldCheck className={cn('w-6 h-6', twofa.enabled ? 'text-green-600' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {twofa.enabled ? '2FA Activado ✓' : '2FA Desactivado'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {twofa.enabled
                        ? 'Tu cuenta requiere un código de verificación al iniciar sesión.'
                        : 'Activa 2FA para proteger tu cuenta con Google Authenticator o similar.'}
                    </p>
                  </div>
                </div>

                {!twofa.enabled && twofa.step === 'idle' && (
                  <Button onClick={handle2FASetup} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                    <ShieldAlert className="w-4 h-4" /> Activar autenticación 2FA
                  </Button>
                )}

                {twofa.step === 'loading' && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generando código QR...
                  </div>
                )}

                {twofa.step === 'scan' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 font-medium">1. Escanea este QR con tu app autenticadora</p>
                    <img src={twofa.qr} alt="QR 2FA" className="w-48 h-48 rounded-xl border border-gray-200 shadow-sm" />
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">O ingresa la clave manualmente:</p>
                      <code className="text-xs font-mono text-violet-700 break-all select-all">{twofa.secret}</code>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">2. Ingresa el código de 6 dígitos para confirmar</p>
                    <div className="flex gap-3">
                      <Input
                        type="text" inputMode="numeric" maxLength={6} placeholder="123456"
                        value={twofa.code}
                        onChange={e => setTwofa(p => ({ ...p, code: e.target.value.replace(/\D/g, '') }))}
                        className="w-36 text-center text-xl tracking-widest font-mono"
                        autoFocus
                      />
                      <Button onClick={handle2FAEnable} disabled={twofa.code.length < 6}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Confirmar y activar
                      </Button>
                    </div>
                    <button onClick={() => setTwofa(p => ({ ...p, step: 'idle', qr: null, secret: null }))}
                      className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                  </div>
                )}

                {twofa.enabled && twofa.step === 'idle' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Ingresa un código actual de tu app para desactivar:</p>
                    <div className="flex gap-3">
                      <Input
                        type="text" inputMode="numeric" maxLength={6} placeholder="123456"
                        value={twofa.code}
                        onChange={e => setTwofa(p => ({ ...p, code: e.target.value.replace(/\D/g, '') }))}
                        className="w-36 text-center text-xl tracking-widest font-mono"
                      />
                      <Button onClick={handle2FADisable} disabled={twofa.code.length < 6}
                        variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2">
                        <AlertCircle className="w-4 h-4" /> Desactivar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              <Card title="Apps compatibles" icon={<ShieldCheck className="w-4 h-4" />}>
                <ul className="space-y-2 text-sm text-gray-600">
                  {['Google Authenticator (iOS / Android)', 'Authy', 'Microsoft Authenticator', '1Password', 'Bitwarden'].map((app, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" /> {app}
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── PASSWORD TAB ── */}
      {activeTab === 'password' && (
        <Card title="Cambiar contraseña" icon={<Lock className="w-4 h-4" />}>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>Contraseña actual</Label>
              <Input type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                placeholder="••••••••" required />
            </div>
            <div className="space-y-1.5">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
                placeholder="Mínimo 8 caracteres" required />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nueva contraseña</Label>
              <Input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Repite la contraseña" required />
            </div>
            <Button type="submit" disabled={savingPwd} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              {savingPwd ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Lock className="w-4 h-4" /> Cambiar contraseña</>}
            </Button>
          </form>
        </Card>
      )}

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <Card title="Mi perfil" icon={<User className="w-4 h-4" />}>
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                  {user?.role?.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl border text-sm
              border-gray-200 text-gray-500">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {user?.email}
            </div>
            <p className="text-xs text-gray-400">Para cambiar tu nombre o email contacta al administrador.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <span className="text-violet-500">{icon}</span>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
