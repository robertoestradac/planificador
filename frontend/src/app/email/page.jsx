'use client';
import { useEffect, useState, useRef } from 'react';
import {
  Mail, Send, Users, Settings, BarChart2, LayoutDashboard,
  FileText, Eye, EyeOff, Plus, Trash2, ChevronRight, X,
  Loader2, CheckCircle2, AlertCircle, RefreshCw, Search,
  TrendingUp, TrendingDown, MousePointer, MailOpen, MailX,
  Zap, Lock, Globe, Key, CheckCheck, Clock, AlertTriangle,
  XCircle, Layers, Edit3, Copy, Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ─── Nav sections ───────────────────────────────────────────── */
const SECTIONS = [
  { id: 'dashboard',  label: 'Inicio',         icon: LayoutDashboard },
  { id: 'compose',    label: 'Nueva campaña',   icon: Send },
  { id: 'campaigns',  label: 'Campañas',        icon: BarChart2 },
  { id: 'templates',  label: 'Plantillas',      icon: Layers },
  { id: 'contacts',   label: 'Contactos',       icon: Users },
  { id: 'settings',   label: 'Configuración',   icon: Settings },
];

/* ─── Email providers ────────────────────────────────────────── */
const PROVIDERS = [
  { id: 'brevo',     label: 'Brevo',      color: 'bg-blue-500',   fields: ['api_key','sender_email','sender_name','list_id'] },
  { id: 'mailchimp', label: 'Mailchimp',  color: 'bg-yellow-500', fields: ['api_key','server_prefix','sender_email','sender_name','list_id'] },
  { id: 'sendgrid',  label: 'SendGrid',   color: 'bg-sky-500',    fields: ['api_key','sender_email','sender_name'] },
  { id: 'smtp',      label: 'SMTP',       color: 'bg-violet-500', fields: ['host','port','user','password','sender_email','sender_name'] },
];

const FIELD_LABELS = {
  api_key: 'API Key', server_prefix: 'Server Prefix', sender_email: 'Email remitente',
  sender_name: 'Nombre remitente', list_id: 'ID de lista', host: 'Host SMTP',
  port: 'Puerto', user: 'Usuario', password: 'Contraseña',
};

/* ─── Status badge ───────────────────────────────────────────── */
const STATUS_MAP = {
  sent:    { label: 'Enviado',   cls: 'bg-green-100 text-green-700',   icon: CheckCheck },
  failed:  { label: 'Fallido',   cls: 'bg-red-100 text-red-700',       icon: XCircle },
  pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  sending: { label: 'Enviando',  cls: 'bg-blue-100 text-blue-700',     icon: Loader2 },
  draft:   { label: 'Borrador',  cls: 'bg-gray-100 text-gray-600',     icon: Edit3 },
};
function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-600', icon: AlertTriangle };
  const Icon = m.icon;
  return <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${m.cls}`}><Icon className="w-3 h-3" />{m.label}</span>;
}

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, pct, trend }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
            {pct !== undefined && <p className="text-xs text-gray-400 mt-0.5">{pct}% tasa</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-','bg-').replace('500','100').replace('600','100')}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}% vs mes anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   PREDEFINED EMAIL TEMPLATES
══════════════════════════════════════════════════════════════ */
const EMAIL_TEMPLATES = [
  {
    id: 'welcome', name: 'Bienvenida', icon: '👋', category: 'Onboarding',
    description: 'Correo de bienvenida para nuevos usuarios',
    subject: '¡Bienvenido a {{app_name}}! 🎉',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700">¡Bienvenido!</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:16px">Nos alegra tenerte con nosotros</p>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Hola <strong>{{nombre}}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">¡Tu cuenta ha sido creada exitosamente! Ahora puedes acceder a todas las funciones de <strong>{{app_name}}</strong>.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{{link}}" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Comenzar ahora →</a>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.7">Si tienes alguna pregunta, no dudes en contactarnos.</p>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}} · <a href="{{unsubscribe_link}}" style="color:#9ca3af">Cancelar suscripción</a></p>
  </div>
</div>`,
  },
  {
    id: 'announcement', name: 'Anuncio', icon: '📢', category: 'Marketing',
    description: 'Comunicado general, novedad o actualización',
    subject: '📢 {{titulo}} — {{app_name}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#0ea5e9,#38bdf8);padding:40px 32px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">📢</div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">{{titulo}}</h1>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Hola <strong>{{nombre}}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">{{cuerpo}}</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{{link}}" style="background:#0ea5e9;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Ver más detalles →</a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}} · <a href="{{unsubscribe_link}}" style="color:#9ca3af">Cancelar suscripción</a></p>
  </div>
</div>`,
  },
  {
    id: 'promo', name: 'Promoción', icon: '🎁', category: 'Marketing',
    description: 'Oferta especial, descuento o campaña de ventas',
    subject: '🎁 Oferta especial para ti — {{descuento}}% OFF',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:40px 32px;text-align:center">
    <div style="font-size:56px;margin-bottom:8px">🎁</div>
    <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800">{{descuento}}% OFF</h1>
    <p style="color:rgba(255,255,255,.9);margin:8px 0 0;font-size:18px;font-weight:600">{{titulo}}</p>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Hola <strong>{{nombre}}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">{{descripcion}}</p>
    <div style="background:#fef9ec;border:2px dashed #f59e0b;border-radius:10px;padding:20px;text-align:center;margin:24px 0">
      <p style="color:#92400e;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Código de descuento</p>
      <p style="color:#78350f;font-size:28px;font-weight:800;margin:0;letter-spacing:.1em">{{codigo}}</p>
    </div>
    <p style="color:#6b7280;font-size:13px;text-align:center">Válido hasta: <strong>{{fecha_expira}}</strong></p>
    <div style="text-align:center;margin:24px 0">
      <a href="{{link}}" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">¡Aprovechar oferta!</a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}} · <a href="{{unsubscribe_link}}" style="color:#9ca3af">Cancelar suscripción</a></p>
  </div>
</div>`,
  },
  {
    id: 'invitation', name: 'Invitación', icon: '💌', category: 'Eventos',
    description: 'Invita a un evento, boda, reunión o celebración',
    subject: '💌 Estás invitado a {{evento}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:48px 32px;text-align:center">
    <div style="font-size:52px;margin-bottom:12px">💌</div>
    <p style="color:rgba(255,255,255,.8);font-size:14px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">Tienes una invitación</p>
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700">{{evento}}</h1>
    <p style="color:rgba(255,255,255,.9);margin:12px 0 0;font-size:16px">{{fecha}} · {{lugar}}</p>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Estimado/a <strong>{{nombre}}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">{{mensaje}}</p>
    <div style="background:#fdf4ff;border-left:4px solid #ec4899;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0">
      <p style="color:#9d174d;font-weight:600;margin:0 0 4px">📅 Fecha: {{fecha}}</p>
      <p style="color:#9d174d;font-weight:600;margin:0 0 4px">📍 Lugar: {{lugar}}</p>
      <p style="color:#9d174d;font-weight:600;margin:0">🕐 Hora: {{hora}}</p>
    </div>
    <div style="text-align:center;margin:28px 0">
      <a href="{{link_confirmar}}" style="background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Confirmar asistencia ✓</a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}} · <a href="{{unsubscribe_link}}" style="color:#9ca3af">Cancelar suscripción</a></p>
  </div>
</div>`,
  },
  {
    id: 'activation', name: 'Activación', icon: '✅', category: 'Transaccional',
    description: 'Confirma y activa la cuenta del usuario',
    subject: '✅ Activa tu cuenta en {{app_name}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 32px;text-align:center">
    <div style="width:64px;height:64px;background:rgba(255,255,255,.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
      <div style="font-size:36px">✅</div>
    </div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Activa tu cuenta</h1>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Hola <strong>{{nombre}}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">Gracias por registrarte en <strong>{{app_name}}</strong>. Para completar tu registro, confirma tu dirección de correo:</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{{link_activacion}}" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Activar mi cuenta →</a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6">Este enlace expira en <strong>24 horas</strong>. Si no creaste esta cuenta, ignora este correo.</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:14px;margin-top:16px">
      <p style="color:#6b7280;font-size:12px;margin:0;word-break:break-all">O copia este enlace en tu navegador: {{link_activacion}}</p>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}}</p>
  </div>
</div>`,
  },
  {
    id: 'password_reset', name: 'Recuperar contraseña', icon: '🔑', category: 'Transaccional',
    description: 'Enlace seguro para restablecer contraseña',
    subject: '🔑 Restablece tu contraseña — {{app_name}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 32px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🔑</div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Restablece tu contraseña</h1>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Hola <strong>{{nombre}}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva contraseña:</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{{link_reset}}" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Crear nueva contraseña →</a>
    </div>
    <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-top:8px">
      <p style="color:#92400e;font-size:13px;margin:0">⚠️ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}}</p>
  </div>
</div>`,
  },
  {
    id: 'unsubscribe', name: 'Dar de baja', icon: '🚪', category: 'Gestión',
    description: 'Confirmar cancelación de suscripción o cuenta',
    subject: 'Has cancelado tu suscripción — {{app_name}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#6b7280,#4b5563);padding:40px 32px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🚪</div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Te has dado de baja</h1>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Hola <strong>{{nombre}}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">Tu suscripción a los correos de <strong>{{app_name}}</strong> ha sido cancelada exitosamente. A partir de ahora no recibirás más comunicaciones.</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">Si fue un error, puedes reactivar tu suscripción en cualquier momento:</p>
    <div style="text-align:center;margin:28px 0">
      <a href="{{link_reactivar}}" style="background:#6b7280;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Reactivar suscripción</a>
    </div>
    <p style="color:#6b7280;font-size:13px;text-align:center">Lamentamos verte partir. Esperamos verte de nuevo pronto.</p>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}}</p>
  </div>
</div>`,
  },
  {
    id: 'newsletter', name: 'Newsletter', icon: '📰', category: 'Marketing',
    description: 'Boletín informativo periódico con noticias',
    subject: '📰 Boletín {{mes}} {{año}} — {{app_name}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px 32px;display:flex;align-items:center;gap:16px">
    <div style="flex:1">
      <p style="color:rgba(255,255,255,.7);font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px">Boletín mensual</p>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">{{mes}} {{año}}</h1>
    </div>
    <div style="font-size:40px">📰</div>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:15px;line-height:1.7">Hola <strong>{{nombre}}</strong>, aquí tienes las novedades de este mes:</p>
    <div style="border-left:3px solid #3b82f6;padding-left:16px;margin:20px 0">
      <h2 style="color:#1e40af;font-size:16px;margin:0 0 8px">🔹 {{titulo_1}}</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0">{{descripcion_1}}</p>
    </div>
    <div style="border-left:3px solid #3b82f6;padding-left:16px;margin:20px 0">
      <h2 style="color:#1e40af;font-size:16px;margin:0 0 8px">🔹 {{titulo_2}}</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0">{{descripcion_2}}</p>
    </div>
    <div style="text-align:center;margin:28px 0">
      <a href="{{link}}" style="background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Ver todas las novedades →</a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">© {{año}} {{app_name}} · <a href="{{unsubscribe_link}}" style="color:#9ca3af">Cancelar suscripción</a></p>
  </div>
</div>`,
  },
  {
    id: 'blank', name: 'En blanco', icon: '✏️', category: 'Personalizado',
    description: 'Empieza desde cero con tu propio diseño',
    subject: '',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:12px">
  <h1 style="color:#111827">Tu título aquí</h1>
  <p style="color:#374151;font-size:15px;line-height:1.7">Escribe tu mensaje aquí...</p>
</div>`,
  },
];

const CATEGORIES = ['Todos', ...new Set(EMAIL_TEMPLATES.map(t => t.category))];

/* ══════════════════════════════════════════════════════════════
   TEMPLATE PICKER MODAL
══════════════════════════════════════════════════════════════ */
function TemplatePicker({ onSelect, onClose }) {
  const [cat, setCat] = useState('Todos');
  const [preview, setPreview] = useState(null);

  const filtered = cat === 'Todos' ? EMAIL_TEMPLATES : EMAIL_TEMPLATES.filter(t => t.category === cat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Seleccionar plantilla</h2>
            <p className="text-xs text-gray-500 mt-0.5">Elige una base o empieza en blanco</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Category filter */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all',
                cat === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400')}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(t => (
                <div key={t.id}
                  onClick={() => setPreview(t)}
                  className={cn('border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md',
                    preview?.id === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300')}>
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <p className="font-semibold text-sm text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.description}</p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{t.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preview panel */}
          {preview && (
            <div className="w-72 border-l border-gray-100 flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{preview.icon}</span>
                  <p className="font-bold text-sm text-gray-900">{preview.name}</p>
                </div>
                <p className="text-xs text-gray-500">{preview.description}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white" style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166%', height: '166%', pointerEvents: 'none' }}>
                  <iframe srcDoc={preview.html} className="w-full border-0" style={{ height: '500px' }} title="preview" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <Button onClick={() => { onSelect(preview); onClose(); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Usar esta plantilla
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPOSER SECTION
══════════════════════════════════════════════════════════════ */
function ComposerSection({ contacts, loadingContacts }) {
  const [subject, setSubject]       = useState('');
  const [html, setHtml]             = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending]       = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);

  const totalSelected = (recipients.includes('all_users') ? (contacts.users?.length || 0) : 0)
    + (recipients.includes('all_guests') ? (contacts.guests?.length || 0) : 0);

  const applyTemplate = (tpl) => {
    setActiveTemplate(tpl);
    setSubject(tpl.subject);
    setHtml(tpl.html);
    setShowPreview(true);
  };

  const handleSend = async () => {
    if (recipients.length === 0) return toast({ variant: 'destructive', title: 'Selecciona destinatarios' });
    if (!subject.trim()) return toast({ variant: 'destructive', title: 'El asunto no puede estar vacío' });
    if (!html.trim()) return toast({ variant: 'destructive', title: 'El contenido del correo está vacío' });
    setSending(true);
    try {
      await api.post('/admin/marketing/email/send', { subject, html, recipients });
      toast({ title: '🚀 Campaña enviada', description: 'Los correos se enviarán en segundo plano.' });
      setSubject(''); setHtml(''); setRecipients([]); setActiveTemplate(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al enviar', description: err.response?.data?.message });
    } finally { setSending(false); }
  };

  return (
    <>
      {showPicker && <TemplatePicker onSelect={applyTemplate} onClose={() => setShowPicker(false)} />}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: editor */}
        <div className="xl:col-span-2 space-y-4">
          {/* Template banner */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-200">
            {activeTemplate ? (
              <>
                <span className="text-2xl">{activeTemplate.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-800">Plantilla: {activeTemplate.name}</p>
                  <p className="text-xs text-indigo-500">{activeTemplate.category}</p>
                </div>
                <button onClick={() => setShowPicker(true)} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Cambiar
                </button>
              </>
            ) : (
              <>
                <Layers className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <p className="flex-1 text-sm text-indigo-700">Elige una plantilla para empezar más rápido</p>
                <Button size="sm" onClick={() => setShowPicker(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Plantillas
                </Button>
              </>
            )}
          </div>

          {/* Subject */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Asunto del correo <span className="text-red-400">*</span></Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Ej: ¡Bienvenido a nuestro servicio! 🎉" className="text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* HTML editor + preview toggle */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Contenido HTML</CardTitle>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(false)}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    !showPreview ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200')}>
                  <Edit3 className="w-3.5 h-3.5" /> Editor
                </button>
                <button onClick={() => setShowPreview(true)}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    showPreview ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200')}>
                  <Eye className="w-3.5 h-3.5" /> Vista previa
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-xl">
              {showPreview ? (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-inner overflow-hidden">
                    {html ? (
                      <iframe srcDoc={html} className="w-full border-0" style={{ height: '500px' }} title="Email preview" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Mail className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">Sin contenido aún</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <textarea
                  value={html}
                  onChange={e => setHtml(e.target.value)}
                  rows={16}
                  placeholder={'<div style="font-family:sans-serif;max-width:600px;margin:0 auto">\n  <h1>Título</h1>\n  <p>Contenido del correo...</p>\n</div>'}
                  className="w-full border-t border-gray-100 p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-[#1e1b4b] text-indigo-100 placeholder-indigo-900 leading-relaxed"
                />
              )}
            </CardContent>
          </Card>

          {/* Variables reference */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Variables disponibles:</p>
            <div className="flex flex-wrap gap-1.5">
              {['{{nombre}}','{{email}}','{{app_name}}','{{link}}','{{codigo}}','{{fecha}}','{{año}}','{{unsubscribe_link}}'].map(v => (
                <code key={v} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-indigo-700 font-mono">{v}</code>
              ))}
            </div>
          </div>
        </div>

        {/* Right: recipients + send */}
        <div className="space-y-4">
          {/* Recipients */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Destinatarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingContacts ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                </div>
              ) : (
                <>
                  {[
                    { id: 'all_users',  label: 'Todos los usuarios',  count: contacts.users?.length ?? 0 },
                    { id: 'all_guests', label: 'Todos los invitados', count: contacts.guests?.length ?? 0 },
                  ].map(g => (
                    <label key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-400 transition-colors">
                      <input type="checkbox" checked={recipients.includes(g.id)}
                        onChange={e => setRecipients(e.target.checked ? [...recipients, g.id] : recipients.filter(v => v !== g.id))}
                        className="w-4 h-4 accent-indigo-600 rounded" />
                      <span className="flex-1 text-sm text-gray-700">{g.label}</span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{g.count}</span>
                    </label>
                  ))}
                  <p className="text-xs text-gray-400 pt-1">
                    Total: <strong className="text-gray-700">{totalSelected} destinatarios</strong>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Send summary */}
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-xs text-indigo-700">
                <span>Asunto</span>
                <span className="font-semibold truncate max-w-[140px]">{subject || '—'}</span>
              </div>
              <div className="flex justify-between text-xs text-indigo-700">
                <span>Destinatarios</span>
                <span className="font-semibold">{totalSelected}</span>
              </div>
              <div className="flex justify-between text-xs text-indigo-700">
                <span>Plantilla</span>
                <span className="font-semibold">{activeTemplate?.name || 'Personalizado'}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSend} disabled={sending || recipients.length === 0}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-base font-bold shadow-md">
            {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : <><Send className="w-5 h-5" /> Enviar campaña</>}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATES LIBRARY SECTION
══════════════════════════════════════════════════════════════ */
function TemplatesSection({ onUse }) {
  const [cat, setCat]           = useState('Todos');
  const [search, setSearch]     = useState('');
  const [preview, setPreview]   = useState(null);

  const filtered = EMAIL_TEMPLATES.filter(t =>
    (cat === 'Todos' || t.category === cat) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plantilla..." className="pl-9" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all',
              cat === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200')}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(t => (
          <Card key={t.id} className="group cursor-pointer hover:shadow-lg transition-shadow border-gray-200 hover:border-indigo-300">
            <CardContent className="p-0 overflow-hidden">
              {/* Preview thumbnail */}
              <div className="relative bg-gray-50 overflow-hidden" style={{ height: '160px' }}>
                <div style={{ transform: 'scale(0.28)', transformOrigin: 'top left', width: '357%', pointerEvents: 'none' }}>
                  <iframe srcDoc={t.html} className="w-full border-0" style={{ height: '600px' }} title={t.name} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-gray-600 font-semibold shadow-sm border border-gray-100">{t.category}</span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{t.icon}</span>
                  <p className="font-semibold text-sm text-gray-800">{t.name}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPreview(t)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button onClick={() => onUse(t)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 transition-all">
                    <Send className="w-3.5 h-3.5" /> Usar
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">{preview.icon}</span>
                <div>
                  <p className="font-bold text-gray-900">{preview.name}</p>
                  <p className="text-xs text-gray-400">{preview.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { onUse(preview); setPreview(null); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Usar plantilla
                </Button>
                <button onClick={() => setPreview(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <iframe srcDoc={preview.html} className="w-full rounded-xl border border-gray-200 bg-white shadow-inner" style={{ height: '600px', border: 'none' }} title="preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD SECTION
══════════════════════════════════════════════════════════════ */
function DashboardSection({ contacts }) {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/marketing/email/stats').catch(() => ({ data: { data: null } })),
      api.get('/admin/marketing/campaigns?channel=email&limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([s, c]) => { setStats(s.data.data); setRecent(c.data.data || []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enviados"   value={stats?.sent ?? 0}       icon={Send}        color="text-indigo-600" trend={stats?.trend_sent} />
        <StatCard label="Entregados" value={stats?.delivered ?? 0}  icon={MailOpen}    color="text-green-600"  pct={stats?.delivery_rate} />
        <StatCard label="Abiertos"   value={stats?.opened ?? 0}     icon={Eye}         color="text-blue-600"   pct={stats?.open_rate} />
        <StatCard label="Rebotados"  value={stats?.bounced ?? 0}    icon={MailX}       color="text-red-600"    />
      </div>

      {/* Contacts summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{contacts.users?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Usuarios con email</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{contacts.guests?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Invitados en listas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> Campañas recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : recent.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin campañas enviadas aún</p>
              <p className="text-xs mt-1">Crea tu primera campaña en "Nueva campaña"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.subject || 'Sin asunto'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {c.recipients_count ? ` · ${c.recipients_count} destinatarios` : ''}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CAMPAIGNS SECTION
══════════════════════════════════════════════════════════════ */
function CampaignsSection() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const load = () => {
    setLoading(true);
    api.get('/admin/marketing/campaigns?channel=email').then(r => setCampaigns(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Historial de campañas</CardTitle>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin campañas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Asunto', 'Destinatarios', 'Abiertos', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-3 max-w-[220px]"><p className="truncate font-medium text-gray-800">{c.subject || '—'}</p></td>
                    <td className="py-3 px-3 text-gray-600">{c.recipients_count ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{c.opened ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONTACTS SECTION
══════════════════════════════════════════════════════════════ */
function ContactsSection({ contacts, loading }) {
  const [search, setSearch] = useState('');
  const [tab, setTab]       = useState('users');
  const list     = tab === 'users' ? contacts.users : contacts.guests;
  const filtered = (list || []).filter(item => {
    const q = search.toLowerCase();
    return !q || (item.name||'').toLowerCase().includes(q) || (item.email||'').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email..." className="pl-9" />
        </div>
      </div>
      <div className="flex gap-2">
        {[{ v: 'users', l: `Usuarios (${contacts.users?.length ?? 0})` }, { v: 'guests', l: `Invitados (${contacts.guests?.length ?? 0})` }].map(({ v, l }) => (
          <button key={v} onClick={() => setTab(v)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
              tab === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200')}>
            {l}
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Nombre', 'Email', 'Estado'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-10 text-gray-400 text-sm">Sin resultados</td></tr>
                  ) : filtered.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                            {(item.name || item.full_name || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{item.name || item.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{item.email || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">{item.role || item.rsvp_status || 'activo'}</Badge>
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

/* ══════════════════════════════════════════════════════════════
   SETTINGS SECTION
══════════════════════════════════════════════════════════════ */
function SettingsSection() {
  const [provider, setProvider] = useState('brevo');
  const [cfg, setCfg]           = useState({});
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState(null);
  const updCfg = p => setCfg(prev => ({ ...prev, ...p }));
  const prov = PROVIDERS.find(p => p.id === provider);

  useEffect(() => {
    api.get('/admin/marketing/email-config').then(r => {
      const d = r.data.data || {};
      if (d.provider) setProvider(d.provider);
      setCfg(d.credentials || {});
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/marketing/email-config', { provider, credentials: cfg });
      toast({ title: 'Configuración guardada' });
    } catch (err) { toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      await api.post('/admin/marketing/email/test', { provider, credentials: cfg });
      setTestResult({ ok: true, msg: `Conexión exitosa con ${prov?.label}` });
    } catch (err) { setTestResult({ ok: false, msg: err.response?.data?.message || 'No se pudo conectar' }); }
    finally { setTesting(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Key className="w-5 h-5 text-indigo-500" /> Proveedor de Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROVIDERS.map(p => (
              <button key={p.id} onClick={() => { setProvider(p.id); setCfg({}); setTestResult(null); }}
                className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all',
                  provider === p.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300')}>
                <div className={`w-5 h-5 rounded-full ${p.color}`} />
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prov?.fields.map(f => (
              <div key={f} className="space-y-1.5">
                <Label>{FIELD_LABELS[f] || f}</Label>
                <div className="relative">
                  <Input type={['password','api_key'].includes(f) ? 'password' : 'text'}
                    value={cfg[f] || ''} onChange={e => updCfg({ [f]: e.target.value })}
                    placeholder={f === 'port' ? '587' : ''} className="pr-8" />
                  {['password','api_key'].includes(f) && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="w-4 h-4" /> Guardar</>}
            </Button>
            <Button onClick={handleTest} disabled={testing} variant="outline" className="gap-2">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Probar conexión
            </Button>
          </div>
          {testResult && (
            <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm border',
              testResult.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {testResult.msg}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HAMBURGER
══════════════════════════════════════════════════════════════ */
function HamburgerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function EmailMarketingPage() {
  const [section, setSection]         = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contacts, setContacts]       = useState({ users: [], guests: [] });
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users').then(r => r.data.data?.data || []).catch(() => []),
      api.get('/guests').then(r => r.data.data?.data || r.data.data || []).catch(() => []),
    ]).then(([users, guests]) => setContacts({ users, guests }))
      .finally(() => setLoadingContacts(false));
  }, []);

  const navTo = (id) => { setSection(id); setSidebarOpen(false); };

  const useTemplate = (tpl) => { navTo('compose'); };

  const Sidebar = (
    <div className="flex flex-col h-full bg-[#1e1b4b]">
      <div className="p-4 border-b border-[#312e81] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold leading-tight">Email</p>
            <p className="text-indigo-300 text-[10px]">Marketing Suite</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-[#312e81] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => navTo(id)}
            className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap',
              section === id ? 'bg-indigo-500 text-white' : 'text-indigo-300 hover:bg-[#312e81] hover:text-white')}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {section === id && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-[#312e81]">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-indigo-400 truncate">Email Marketing Suite</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col">{Sidebar}</aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex-shrink-0 flex flex-col shadow-2xl">{Sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <HamburgerIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {SECTIONS.find(s => s.id === section)?.label}
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">Email Marketing Suite</p>
          </div>
          {section !== 'compose' && (
            <Button size="sm" onClick={() => navTo('compose')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 flex-shrink-0">
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva campaña</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          )}
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {section === 'dashboard'  && <DashboardSection contacts={contacts} />}
            {section === 'compose'    && <ComposerSection contacts={contacts} loadingContacts={loadingContacts} />}
            {section === 'campaigns'  && <CampaignsSection />}
            {section === 'templates'  && <TemplatesSection onUse={(tpl) => { navTo('compose'); }} />}
            {section === 'contacts'   && <ContactsSection contacts={contacts} loading={loadingContacts} />}
            {section === 'settings'   && <SettingsSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
