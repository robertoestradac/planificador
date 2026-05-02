'use client';
import { useState, useEffect } from 'react';
import {
  Save, Loader2, Settings, Globe, Mail, Image as ImageIcon, Eye, EyeOff, CheckCircle,
  Sparkles, Server, Lock, Zap, Send, CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert,
  MessageCircle,
} from 'lucide-react';
import useSettingsStore from '@/store/settingsStore';
import ImageUpload from '@/app/dashboard/builder/[id]/components/ImageUpload';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  const { settings, fetch, update, loaded } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('general');
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  /* ── SMTP state ── */
  const [smtp, setSmtp] = useState({ host: '', port: '587', secure: false, user: '', password: '', from_email: '', from_name: '' });
  const [savingSmtp, setSavingSmtp]   = useState(false);
  const [loadingSmtp, setLoadingSmtp] = useState(false);
  const [smtpConnected, setSmtpConnected] = useState(false);
  const [testing, setTesting]         = useState(false);
  const [testEmail, setTestEmail]     = useState('');
  const [testResult, setTestResult]   = useState(null);

  /* ── 2FA state ── */
  const [twofa, setTwofa]             = useState({ enabled: false, loading: true, qr: null, secret: null, code: '', step: 'idle' });
  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (loaded && !form) {
      setForm({
        app_name:       settings.app_name       || '',
        tagline:        settings.tagline        || '',
        logo_url:       settings.logo_url       || '',
        app_url:        settings.app_url        || '',
        support_email:  settings.support_email  || '',
        footer_text:    settings.footer_text    || '',
        show_branding:  Boolean(settings.show_branding),
        sales_whatsapp: settings.sales_whatsapp || '',
      });
    }
  }, [loaded, settings]);

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
    } catch (err) { toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message }); setTwofa(p => ({ ...p, step: 'idle' })); }
  };

  const handle2FAEnable = async () => {
    try {
      await api.post('/auth/2fa/enable', { code: twofa.code });
      setTwofa(p => ({ ...p, enabled: true, step: 'idle', qr: null, secret: null, code: '' }));
      toast({ title: '2FA activado', description: 'Tu cuenta ahora está protegida con autenticación de dos pasos.' });
    } catch (err) { toast({ variant: 'destructive', title: 'Código incorrecto', description: err.response?.data?.message }); }
  };

  const handle2FADisable = async () => {
    try {
      await api.post('/auth/2fa/disable', { code: twofa.code });
      setTwofa(p => ({ ...p, enabled: false, step: 'idle', code: '' }));
      toast({ title: '2FA desactivado' });
    } catch (err) { toast({ variant: 'destructive', title: 'Código incorrecto', description: err.response?.data?.message }); }
  };

  useEffect(() => {
    if (activeTab !== 'smtp' || loadingSmtp || smtpConnected || smtp.host) return;
    setLoadingSmtp(true);
    api.get('/admin/marketing/smtp-config')
      .then(r => { 
        const d = r.data.data || {}; 
        setSmtp(p => ({ ...p, ...d })); 
        setSmtpConnected(!!d.host && !!d.user && !!d.password); 
      })
      .catch(() => {})
      .finally(() => setLoadingSmtp(false));
  }, [activeTab]);

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({ ...form, show_branding: form.show_branding ? 1 : 0, logo_url: form.logo_url || null, app_url: form.app_url || null, support_email: form.support_email || null });
      toast({ title: 'Configuración guardada', description: 'Los cambios se reflejarán en toda la aplicación.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la configuración.' });
    } finally { setSaving(false); }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const response = await api.put('/admin/marketing/smtp-config', smtp);
      const isConfigured = !!smtp.host && !!smtp.user && !!smtp.password;
      setSmtpConnected(isConfigured);
      toast({ title: 'SMTP configurado correctamente' });
    } catch (err) { 
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message }); 
    }
    finally { setSavingSmtp(false); }
  };

  const handleTestSmtp = async () => {
    if (!testEmail) {
      return toast({ variant: 'destructive', title: 'Ingresa un email de prueba' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return toast({ variant: 'destructive', title: 'Email inválido', description: 'Por favor ingresa un email válido' });
    }
    
    setTesting(true); 
    setTestResult(null);
    
    try {
      const response = await api.post('/admin/marketing/smtp/test', { to: testEmail });
      setTestResult({ ok: true, msg: response.data.message || `Correo de prueba enviado a ${testEmail}` });
    } catch (err) { 
      console.error('SMTP Test Error:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Error de conexión SMTP';
      setTestResult({ ok: false, msg: errorMsg }); 
    }
    finally { 
      setTesting(false); 
    }
  };

  if (!form) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header + Tabs */}
      <div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
            <Settings className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-sm text-gray-500">App, branding y correos transaccionales</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit flex-wrap">
          {[{ id: 'general', label: 'General', icon: Settings }, { id: 'ventas', label: 'Ventas', icon: MessageCircle }, { id: 'smtp', label: 'SMTP Transaccional', icon: Server }, { id: '2fa', label: 'Seguridad 2FA', icon: ShieldAlert }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              <Icon className={cn('w-4 h-4', activeTab === id ? 'text-violet-500' : 'text-gray-400')} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'general' && <>
      <Section title="Identidad de marca" icon={<Sparkles className="w-4 h-4" />}>
        <div className="grid grid-cols-1 gap-6">
          {/* Logo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo de la aplicación</label>
            <p className="text-xs text-gray-500 mb-3">Se mostrará en el sidebar, login y encabezados. Tamaño recomendado: 64×64px.</p>
            <div className="flex items-start gap-4">
              <div className="flex-1 max-w-xs">
                <ImageUpload
                  value={form.logo_url}
                  onChange={url => handleChange('logo_url', url || '')}
                />
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-xs text-gray-400 font-medium">Vista previa</p>
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center overflow-hidden shadow">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
                    : <Sparkles className="w-5 h-5 text-white" />
                  }
                </div>
              </div>
            </div>
          </div>

          {/* App name */}
          <Field label="Nombre de la aplicación" required>
            <input
              type="text"
              value={form.app_name}
              onChange={e => handleChange('app_name', e.target.value)}
              placeholder="InvitApp"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none bg-gray-50"
            />
          </Field>

          {/* Tagline */}
          <Field label="Tagline / Descripción corta">
            <input
              type="text"
              value={form.tagline}
              onChange={e => handleChange('tagline', e.target.value)}
              placeholder="Plataforma de invitaciones digitales"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none bg-gray-50"
            />
          </Field>
        </div>
      </Section>

      {/* Links */}
      <Section title="Links y contacto" icon={<Globe className="w-4 h-4" />}>
        <div className="grid grid-cols-1 gap-5">
          <Field label="URL de la aplicación" hint="Usado en el footer de las invitaciones">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="url"
                value={form.app_url}
                onChange={e => handleChange('app_url', e.target.value)}
                placeholder="https://invitapp.com"
                className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </Field>

          <Field label="Email de soporte">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="email"
                value={form.support_email}
                onChange={e => handleChange('support_email', e.target.value)}
                placeholder="soporte@invitapp.com"
                className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </Field>
        </div>
      </Section>

      {/* Footer invitations */}
      <Section title="Footer de invitaciones" icon={<ImageIcon className="w-4 h-4" />}>
        <div className="space-y-5">
          {/* Show/hide toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-800">Mostrar branding en invitaciones</p>
              <p className="text-xs text-gray-500 mt-0.5">Muestra el logo y nombre de la app al final de cada invitación</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('show_branding', !form.show_branding)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.show_branding ? 'bg-violet-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.show_branding ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <Field label="Texto del footer" hint="Puede incluir emojis. Ej: Hecha con ♥ por InvitApp">
            <input
              type="text"
              value={form.footer_text}
              onChange={e => handleChange('footer_text', e.target.value)}
              placeholder="Hecha con ♥ por InvitApp"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none bg-gray-50"
            />
          </Field>

          {/* Preview */}
          {form.show_branding && (
            <div className="p-4 bg-gray-100 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vista previa del footer</p>
              <div className="flex items-center justify-center gap-2 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center overflow-hidden">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="" className="w-full h-full object-cover" />
                    : <Sparkles className="w-3 h-3 text-white" />
                  }
                </div>
                <span className="text-xs text-gray-500">{form.footer_text || 'Hecha con ♥ por InvitApp'}</span>
                {form.app_url && (
                  <span className="text-xs text-violet-500 font-medium">· {form.app_url.replace('https://', '')}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Save general */}
      <div className="sticky bottom-0 -mx-1 px-1 pb-1 pt-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 rounded-2xl shadow-lg transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
      </>}

      {/* ── VENTAS TAB ── */}
      {activeTab === 'ventas' && (
        <div className="space-y-6 max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">WhatsApp de Ventas</h3>
                <p className="text-xs text-gray-500">Número al que se enviarán las solicitudes de plan de los tenants</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wa-number">Número de WhatsApp</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 h-10 flex items-center select-none">+</span>
                <Input
                  id="wa-number"
                  type="tel"
                  placeholder="502xxxxxxxx  (código país sin +)"
                  value={form.sales_whatsapp || ''}
                  onChange={e => handleChange('sales_whatsapp', e.target.value.replace(/\D/g, ''))}
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-gray-400">Incluye el código de país sin el signo +. Ej: para Guatemala → <span className="font-mono">502xxxxxxxx</span></p>
            </div>

            {form.sales_whatsapp && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                Los tenants verán el botón <strong>"Solicitar plan"</strong> que abrirá WhatsApp con el número <span className="font-mono font-bold">+{form.sales_whatsapp}</span>
              </div>
            )}

            {!form.sales_whatsapp && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                ⚠ Sin número configurado los tenants no podrán solicitar planes por WhatsApp.
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar número</>}
            </Button>
          </div>
        </div>
      )}

      {/* ── SMTP TAB ── */}
      {activeTab === 'smtp' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">

            <Section title="Configuración SMTP" icon={<Server className="w-4 h-4" />}>
              <div className="flex items-center gap-2 mb-4">
                <div className={cn('w-2 h-2 rounded-full', smtpConnected ? 'bg-green-500' : 'bg-gray-300')} />
                <span className={cn('text-xs font-semibold', smtpConnected ? 'text-green-600' : 'text-gray-400')}>
                  {smtpConnected ? 'Configurado' : 'Sin configurar'}
                </span>
                {!smtpConnected && smtp.host && (
                  <span className="text-xs text-amber-600 ml-2">
                    (Falta: {!smtp.host ? 'host' : ''}{!smtp.user ? (!smtp.host ? ', usuario' : 'usuario') : ''}{!smtp.password ? (!smtp.host || !smtp.user ? ', contraseña' : 'contraseña') : ''})
                  </span>
                )}
              </div>
              {loadingSmtp ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div> : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Host SMTP <span className="text-red-500">*</span></Label>
                      <Input value={smtp.host} onChange={e => setSmtp(p => ({ ...p, host: e.target.value }))} placeholder="smtp-relay.brevo.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Puerto</Label>
                      <Input value={smtp.port} onChange={e => setSmtp(p => ({ ...p, port: e.target.value }))} placeholder="587" type="number" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Usuario <span className="text-red-500">*</span></Label>
                      <Input value={smtp.user} onChange={e => setSmtp(p => ({ ...p, user: e.target.value }))} placeholder="tu-email@gmail.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contraseña / SMTP Key <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input type="password" value={smtp.password} onChange={e => setSmtp(p => ({ ...p, password: e.target.value }))} placeholder="Tu SMTP key de Brevo" className="pr-10" />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email remitente</Label>
                      <Input value={smtp.from_email} onChange={e => setSmtp(p => ({ ...p, from_email: e.target.value }))} placeholder="noreply@tudominio.com" type="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nombre remitente</Label>
                      <Input value={smtp.from_name} onChange={e => setSmtp(p => ({ ...p, from_name: e.target.value }))} placeholder="Mi Aplicación" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={smtp.secure} onChange={e => setSmtp(p => ({ ...p, secure: e.target.checked }))} className="w-4 h-4 accent-violet-600" />
                    <span className="text-sm text-gray-700">Usar SSL/TLS (puerto 465)</span>
                  </label>
                  <Button onClick={handleSaveSmtp} disabled={savingSmtp || !smtp.host || !smtp.user || !smtp.password} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                    {savingSmtp ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="w-4 h-4" /> Guardar SMTP</>}
                  </Button>
                </div>
              )}
            </Section>

            <Section title="Prueba de conexión" icon={<Zap className="w-4 h-4" />}>
              <div className="space-y-3">
                {!smtpConnected && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Primero debes configurar y guardar el SMTP (host, usuario y contraseña)</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <Input 
                    value={testEmail} 
                    onChange={e => setTestEmail(e.target.value)} 
                    placeholder="email@destino.com" 
                    type="email" 
                    className="flex-1"
                    disabled={!smtpConnected}
                  />
                  <Button 
                    onClick={handleTestSmtp} 
                    disabled={testing || !smtpConnected || !testEmail} 
                    variant="outline" 
                    className="gap-2 shrink-0"
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
                    Enviar prueba
                  </Button>
                </div>
                {testResult && (
                  <div className={cn('flex items-center gap-2 mt-3 p-3 rounded-xl text-sm border',
                    testResult.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                    {testResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    {testResult.msg}
                  </div>
                )}
              </div>
            </Section>

          </div>

          <div className="space-y-6">
            <Section title="Proveedores recomendados" icon={<Globe className="w-4 h-4" />}>
              <div className="space-y-3 text-sm">
                {[
                  { name: 'Gmail',    smtp: 'smtp.gmail.com',            port: '587', note: 'Requiere App Password' },
                  { name: 'Outlook',  smtp: 'smtp.office365.com',        port: '587', note: 'Cuenta Microsoft' },
                  { name: 'Brevo',    smtp: 'smtp-relay.brevo.com',      port: '587', note: 'Gratis hasta 300/día' },
                  { name: 'Mailtrap', smtp: 'sandbox.smtp.mailtrap.io',  port: '2525', note: 'Solo testing' },
                ].map(p => (
                  <div key={p.name} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span className="text-xs text-gray-400">:{p.port}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{p.smtp}</p>
                    <p className="text-xs text-gray-400 mt-1">{p.note}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Cuándo se usa" icon={<ShieldCheck className="w-4 h-4" />}>
              <ul className="space-y-2 text-sm text-gray-600">
                {['Activación de cuenta nueva','Bienvenida al registrarse','Restablecimiento de contraseña','Confirmación de plan/pago','Notificación de invitación'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      )}

      {/* ── 2FA TAB ── */}
      {activeTab === '2fa' && (
        <div className="max-w-lg space-y-6">
          {twofa.loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-500" /></div>
          ) : (
            <>
              <Section title="Autenticación de dos pasos (2FA)" icon={<ShieldAlert className="w-4 h-4" />}>
                <div className="flex items-start gap-4 mb-5">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                    twofa.enabled ? 'bg-green-100' : 'bg-gray-100')}>
                    <ShieldCheck className={cn('w-6 h-6', twofa.enabled ? 'text-green-600' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {twofa.enabled ? '2FA Activado' : '2FA Desactivado'}
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
                    <p className="text-sm text-gray-600 font-medium">1. Escanea el código QR con tu app autenticadora</p>
                    <img src={twofa.qr} alt="QR 2FA" className="w-48 h-48 rounded-xl border border-gray-200 shadow-sm" />
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">O ingresa la clave manual:</p>
                      <code className="text-xs font-mono text-violet-700 break-all">{twofa.secret}</code>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">2. Ingresa el código de 6 dígitos para confirmar</p>
                    <div className="flex gap-3">
                      <Input
                        type="text" inputMode="numeric" maxLength={6} placeholder="123456"
                        value={twofa.code}
                        onChange={e => setTwofa(p => ({ ...p, code: e.target.value }))}
                        className="w-36 text-center text-lg tracking-widest font-mono"
                      />
                      <Button onClick={handle2FAEnable} disabled={twofa.code.length < 6}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Confirmar
                      </Button>
                    </div>
                    <button onClick={() => setTwofa(p => ({ ...p, step: 'idle', qr: null, secret: null }))}
                      className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                  </div>
                )}

                {twofa.enabled && twofa.step === 'idle' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Ingresa un código actual para desactivar el 2FA:</p>
                    <div className="flex gap-3">
                      <Input
                        type="text" inputMode="numeric" maxLength={6} placeholder="123456"
                        value={twofa.code}
                        onChange={e => setTwofa(p => ({ ...p, code: e.target.value }))}
                        className="w-36 text-center text-lg tracking-widest font-mono"
                      />
                      <Button onClick={handle2FADisable} disabled={twofa.code.length < 6}
                        variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2">
                        <AlertCircle className="w-4 h-4" /> Desactivar 2FA
                      </Button>
                    </div>
                  </div>
                )}
              </Section>

              <Section title="Apps compatibles" icon={<ShieldCheck className="w-4 h-4" />}>
                <ul className="space-y-2 text-sm text-gray-600">
                  {['Google Authenticator (iOS / Android)', 'Authy', 'Microsoft Authenticator', '1Password', 'Bitwarden'].map((app, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" /> {app}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }) {
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

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-pink-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
