'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MessageSquare, Send, Users, FileText, Settings, BarChart2,
  CheckCircle2, AlertCircle, Loader2, Plus, Trash2, X,
  Image, MousePointer2, List, Type, ImagePlus, Upload, Lock,
  Link2, Key, Phone, TrendingUp, TrendingDown, Eye, Clock,
  Search, Filter, ChevronRight, RefreshCw, Zap, Globe,
  LayoutDashboard, CheckCheck, XCircle, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ─── Inner nav ──────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'dashboard',  label: 'Inicio',         icon: LayoutDashboard },
  { id: 'compose',    label: 'Nueva campaña',   icon: Send },
  { id: 'campaigns',  label: 'Campañas',        icon: BarChart2 },
  { id: 'contacts',   label: 'Contactos',       icon: Users },
  { id: 'templates',  label: 'Templates',       icon: FileText },
  { id: 'settings',   label: 'Configuración',   icon: Settings },
];

/* ─── Message types ──────────────────────────────────────────── */
const WA_TYPES = [
  { v: 'text',     l: 'Texto',    icon: Type },
  { v: 'image',    l: 'Imagen',   icon: ImagePlus },
  { v: 'buttons',  l: 'Botones',  icon: MousePointer2 },
  { v: 'list',     l: 'Lista',    icon: List },
  { v: 'template', l: 'Template', icon: FileText },
];

/* ─── Helpers ────────────────────────────────────────────────── */
const STATUS_MAP = {
  sent:    { label: 'Enviado',   cls: 'bg-green-100 text-green-700',  icon: CheckCheck },
  failed:  { label: 'Fallido',   cls: 'bg-red-100 text-red-700',      icon: XCircle },
  pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  sending: { label: 'Enviando',  cls: 'bg-blue-100 text-blue-700',    icon: Loader2 },
};

function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-600', icon: AlertTriangle };
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${m.cls}`}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('500', '100')}`}>
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
   LIVE PREVIEW BUBBLE
══════════════════════════════════════════════════════════════ */
function WaPreviewBubble({ c }) {
  const base = 'bg-white rounded-2xl rounded-tl-none shadow-md p-3 max-w-[240px] text-sm text-gray-800 space-y-1.5';
  if (c.type === 'text') return (
    <div className={base}>
      <p className="whitespace-pre-wrap text-xs leading-relaxed">
        {c.text || <span className="text-gray-300 italic">Sin texto aún...</span>}
      </p>
    </div>
  );
  if (c.type === 'image') return (
    <div className={`${base} p-0 overflow-hidden`}>
      {c.imageUrl
        ? <img src={c.imageUrl} alt="" className="w-full h-36 object-cover rounded-t-2xl" onError={e => { e.target.style.display = 'none'; }} />
        : <div className="w-full h-36 bg-gray-100 rounded-t-2xl flex items-center justify-center text-gray-300"><Image className="w-8 h-8" /></div>}
      {c.imageCaption && <p className="px-3 py-2 text-xs text-gray-600">{c.imageCaption}</p>}
    </div>
  );
  if (c.type === 'buttons') return (
    <div className={`${base} p-0 overflow-hidden`}>
      {c.btnHeaderType === 'image' && c.btnHeaderContent && (
        <img src={c.btnHeaderContent} alt="" className="w-full h-28 object-cover" onError={e => { e.target.style.display = 'none'; }} />
      )}
      {c.btnHeaderType === 'text' && c.btnHeaderContent && (
        <p className="px-3 pt-2.5 font-bold text-xs">{c.btnHeaderContent}</p>
      )}
      <div className="px-3 py-2">
        <p className="text-xs leading-relaxed">{c.btnBody || <span className="text-gray-300 italic">Cuerpo del mensaje...</span>}</p>
        {c.btnFooter && <p className="text-[10px] text-gray-400 mt-1">{c.btnFooter}</p>}
      </div>
      {c.buttons.some(b => b.title) && (
        <div className="border-t border-gray-100">
          {c.buttons.filter(b => b.title).slice(0, 3).map((b, i) => (
            <div key={i} className={cn('flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-[#25D366]', i > 0 && 'border-t border-gray-100')}>
              <MousePointer2 className="w-3 h-3" /> {b.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  if (c.type === 'list') return (
    <div className={`${base} p-0 overflow-hidden`}>
      {c.listHeader && <p className="px-3 pt-2.5 font-bold text-xs">{c.listHeader}</p>}
      <div className="px-3 py-2">
        <p className="text-xs leading-relaxed">{c.listBody || <span className="text-gray-300 italic">Cuerpo...</span>}</p>
        {c.listFooter && <p className="text-[10px] text-gray-400 mt-1">{c.listFooter}</p>}
      </div>
      <div className="border-t border-gray-100 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-[#25D366]">
        <List className="w-3 h-3" /> {c.listBtnLabel || 'Ver opciones'}
      </div>
    </div>
  );
  if (c.type === 'template') return (
    <div className={base}>
      <div className="flex items-center gap-1.5 text-[10px] text-[#25D366] font-bold uppercase tracking-wider">
        <FileText className="w-3 h-3" /> Template
      </div>
      <p className="font-mono text-xs text-gray-700 font-semibold">{c.templateName || 'hello_world'}</p>
      <p className="text-[10px] text-gray-400">{c.templateLang}</p>
    </div>
  );
  return null;
}

/* ══════════════════════════════════════════════════════════════
   COMPOSER
══════════════════════════════════════════════════════════════ */
const EMPTY_COMPOSER = {
  type: 'text', text: '',
  imageUrl: '', imageCaption: '',
  btnHeaderType: 'none', btnHeaderContent: '', btnBody: '', btnFooter: '',
  buttons: [{ id: 'btn_1', title: '' }],
  listHeader: '', listBody: '', listFooter: '', listBtnLabel: 'Ver opciones',
  listSections: [{ title: '', rows: [{ id: 'row_1', title: '', description: '' }] }],
  templateName: '', templateLang: 'es_MX', templateVars: '',
};

function ComposerSection({ connected, contacts, loadingContacts }) {
  const [c, setC] = useState({ ...EMPTY_COMPOSER });
  const upd = p => setC(prev => ({ ...prev, ...p }));
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const inp = 'w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] resize-none';

  const uploadFile = async (file, field) => {
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/upload', fd);
      upd({ [field]: r.data.data?.url || r.data.url || '' });
      toast({ title: 'Imagen subida correctamente' });
    } catch { toast({ variant: 'destructive', title: 'Error al subir imagen' }); }
    finally { setUploadingImg(false); }
  };

  const buildPayload = () => {
    if (c.type === 'text')     return { type: 'text', text: { body: c.text } };
    if (c.type === 'image')    return { type: 'image', image: { link: c.imageUrl, ...(c.imageCaption ? { caption: c.imageCaption } : {}) } };
    if (c.type === 'template') return { type: 'template', template: { name: c.templateName, language: { code: c.templateLang } } };
    if (c.type === 'buttons') {
      const header = c.btnHeaderType === 'text' ? { type: 'text', text: c.btnHeaderContent }
        : c.btnHeaderType === 'image' ? { type: 'image', image: { link: c.btnHeaderContent } } : undefined;
      return { type: 'interactive', interactive: {
        type: 'button', ...(header ? { header } : {}),
        body: { text: c.btnBody }, ...(c.btnFooter ? { footer: { text: c.btnFooter } } : {}),
        action: { buttons: c.buttons.filter(b => b.title).slice(0, 3).map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
      }};
    }
    if (c.type === 'list') return { type: 'interactive', interactive: {
      type: 'list', ...(c.listHeader ? { header: { type: 'text', text: c.listHeader } } : {}),
      body: { text: c.listBody }, ...(c.listFooter ? { footer: { text: c.listFooter } } : {}),
      action: { button: c.listBtnLabel || 'Ver opciones', sections: c.listSections.map(s => ({
        title: s.title, rows: s.rows.filter(r => r.title).map(r => ({ id: r.id, title: r.title, ...(r.description ? { description: r.description } : {}) })),
      })) },
    }};
    return null;
  };

  const handleSend = async () => {
    if (recipients.length === 0) return toast({ variant: 'destructive', title: 'Selecciona al menos un grupo de destinatarios' });
    const payload = buildPayload();
    if (!payload) return toast({ variant: 'destructive', title: 'Completa el mensaje' });
    if (c.type === 'text' && !c.text.trim()) return toast({ variant: 'destructive', title: 'El mensaje no puede estar vacío' });
    setSending(true);
    try {
      await api.post('/admin/marketing/whatsapp/send', { message: payload, recipients });
      toast({ title: '🚀 Campaña iniciada', description: 'Los mensajes se enviarán en segundo plano.' });
      setC({ ...EMPTY_COMPOSER });
      setRecipients([]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al enviar', description: err.response?.data?.message });
    } finally { setSending(false); }
  };

  const totalSelected = (recipients.includes('all_users') ? (contacts.users?.length || 0) : 0)
    + (recipients.includes('all_guests') ? (contacts.guests?.length || 0) : 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* ── Left: composer ── */}
      <div className="xl:col-span-2 space-y-5">
        {!connected && (
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 flex gap-2 text-xs text-yellow-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Configura las credenciales de WhatsApp Business API en Configuración antes de enviar.
          </div>
        )}

        {/* Type bar */}
        <div className="grid grid-cols-5 gap-2">
          {WA_TYPES.map(({ v, l, icon: Icon }) => (
            <button key={v} onClick={() => upd({ type: v })}
              className={cn('flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-semibold transition-all',
                c.type === v ? 'bg-[#25D366] text-white border-[#25D366] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-[#25D366]')}>
              <Icon className="w-4 h-4" /> {l}
            </button>
          ))}
        </div>

        {/* Form area */}
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* TEXT */}
            {c.type === 'text' && (
              <div className="space-y-1.5">
                <Label>Mensaje <span className="text-gray-400 text-xs">(soporta *negrita*, _cursiva_, emojis)</span></Label>
                <textarea rows={7} value={c.text} maxLength={4096} onChange={e => upd({ text: e.target.value })}
                  placeholder={'Hola *{{nombre}}*,\n\nTe invitamos a nuestro evento especial 🎉\n\n_Más información en nuestra página web._'}
                  className={inp} />
                <p className="text-right text-xs text-gray-400">{c.text.length} / 4096</p>
              </div>
            )}

            {/* IMAGE */}
            {c.type === 'image' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Imagen <span className="text-gray-400 text-xs">(PNG, JPG, WEBP — máx 5 MB)</span></Label>
                  <div className="flex gap-2">
                    <Input value={c.imageUrl} onChange={e => upd({ imageUrl: e.target.value })}
                      placeholder="https://mi-dominio.com/imagen.jpg" className="flex-1" />
                    <label className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer hover:border-[#25D366] transition-colors shrink-0 bg-white',
                      uploadingImg && 'opacity-60 pointer-events-none')}>
                      {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Subir
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'imageUrl'); }} />
                    </label>
                  </div>
                  {c.imageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden h-32 border border-gray-100">
                      <img src={c.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Caption <span className="text-gray-400 text-xs">(opcional)</span></Label>
                  <textarea rows={3} value={c.imageCaption} onChange={e => upd({ imageCaption: e.target.value })}
                    placeholder="Descripción de la imagen..." className={inp} />
                </div>
              </div>
            )}

            {/* BUTTONS */}
            {c.type === 'buttons' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Encabezado <span className="text-gray-400 text-xs">(opcional)</span></Label>
                  <div className="flex gap-2">
                    {[{ v: 'none', l: 'Ninguno' }, { v: 'text', l: 'Texto' }, { v: 'image', l: 'Imagen' }].map(({ v, l }) => (
                      <button key={v} onClick={() => upd({ btnHeaderType: v })}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          c.btnHeaderType === v ? 'bg-[#25D366] text-white border-[#25D366]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#25D366]')}>
                        {l}
                      </button>
                    ))}
                  </div>
                  {c.btnHeaderType === 'text' && (
                    <Input value={c.btnHeaderContent} onChange={e => upd({ btnHeaderContent: e.target.value })} placeholder="Título del encabezado" />
                  )}
                  {c.btnHeaderType === 'image' && (
                    <div className="flex gap-2">
                      <Input value={c.btnHeaderContent} onChange={e => upd({ btnHeaderContent: e.target.value })} placeholder="https://..." className="flex-1" />
                      <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm cursor-pointer hover:border-[#25D366] bg-white shrink-0">
                        <Upload className="w-4 h-4" /> Subir
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'btnHeaderContent'); }} />
                      </label>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Cuerpo <span className="text-red-400">*</span></Label>
                  <textarea rows={4} value={c.btnBody} onChange={e => upd({ btnBody: e.target.value })}
                    placeholder="¿Te gustaría conocer más sobre nuestra oferta?" className={inp} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pie <span className="text-gray-400 text-xs">(opcional)</span></Label>
                  <Input value={c.btnFooter} onChange={e => upd({ btnFooter: e.target.value })} placeholder="Responde cuando quieras" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Botones de respuesta rápida <span className="text-gray-400 text-xs">(máx 3)</span></Label>
                    {c.buttons.length < 3 && (
                      <button onClick={() => upd({ buttons: [...c.buttons, { id: `btn_${Date.now()}`, title: '' }] })}
                        className="text-xs text-[#25D366] hover:underline font-semibold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    )}
                  </div>
                  {c.buttons.map((b, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input value={b.title} maxLength={20}
                        onChange={e => upd({ buttons: c.buttons.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x) })}
                        placeholder={`Botón ${i + 1} (máx 20 chars)`} className="flex-1" />
                      {c.buttons.length > 1 && (
                        <button onClick={() => upd({ buttons: c.buttons.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 p-1.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIST */}
            {c.type === 'list' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Encabezado <span className="text-gray-400 text-xs">(opcional)</span></Label>
                    <Input value={c.listHeader} onChange={e => upd({ listHeader: e.target.value })} placeholder="Menú de opciones" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Texto del botón</Label>
                    <Input value={c.listBtnLabel} onChange={e => upd({ listBtnLabel: e.target.value })} placeholder="Ver opciones" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Cuerpo <span className="text-red-400">*</span></Label>
                  <textarea rows={3} value={c.listBody} onChange={e => upd({ listBody: e.target.value })}
                    placeholder="Selecciona una opción:" className={inp} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pie <span className="text-gray-400 text-xs">(opcional)</span></Label>
                  <Input value={c.listFooter} onChange={e => upd({ listFooter: e.target.value })} placeholder="Atención 24/7" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Secciones y opciones</Label>
                    <button onClick={() => upd({ listSections: [...c.listSections, { title: '', rows: [{ id: `row_${Date.now()}`, title: '', description: '' }] }] })}
                      className="text-xs text-[#25D366] font-semibold flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Sección
                    </button>
                  </div>
                  {c.listSections.map((sec, si) => (
                    <div key={si} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                      <Input value={sec.title} placeholder={`Sección ${si + 1}`}
                        onChange={e => upd({ listSections: c.listSections.map((s, i) => i === si ? { ...s, title: e.target.value } : s) })} />
                      {sec.rows.map((row, ri) => (
                        <div key={ri} className="flex gap-2 bg-white rounded-lg p-2 border border-gray-100">
                          <div className="flex-1 space-y-1.5">
                            <Input value={row.title} placeholder="Opción" className="h-8 text-xs"
                              onChange={e => upd({ listSections: c.listSections.map((s, i) => i === si ? { ...s, rows: s.rows.map((r, j) => j === ri ? { ...r, title: e.target.value } : r) } : s) })} />
                            <Input value={row.description} placeholder="Descripción (opcional)" className="h-8 text-xs text-gray-400"
                              onChange={e => upd({ listSections: c.listSections.map((s, i) => i === si ? { ...s, rows: s.rows.map((r, j) => j === ri ? { ...r, description: e.target.value } : r) } : s) })} />
                          </div>
                          {sec.rows.length > 1 && (
                            <button onClick={() => upd({ listSections: c.listSections.map((s, i) => i === si ? { ...s, rows: s.rows.filter((_, j) => j !== ri) } : s) })}
                              className="text-red-400 p-1 self-start mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => upd({ listSections: c.listSections.map((s, i) => i === si ? { ...s, rows: [...s.rows, { id: `row_${Date.now()}`, title: '', description: '' }] } : s) })}
                        className="text-xs text-[#25D366] font-semibold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Opción
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEMPLATE */}
            {c.type === 'template' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 flex gap-2 text-xs text-yellow-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Templates deben estar aprobados en Meta Business Manager.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre del template</Label>
                    <Input value={c.templateName} onChange={e => upd({ templateName: e.target.value })} placeholder="hello_world" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Idioma</Label>
                    <select value={c.templateLang} onChange={e => upd({ templateLang: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-[#25D366] focus:outline-none">
                      <option value="es_MX">Español (MX)</option>
                      <option value="es">Español</option>
                      <option value="en_US">English (US)</option>
                      <option value="pt_BR">Português (BR)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Variables del cuerpo <span className="text-gray-400 text-xs">(una por línea)</span></Label>
                  <textarea rows={3} value={c.templateVars} onChange={e => upd({ templateVars: e.target.value })}
                    placeholder={'Juan Pérez\n15 mayo 2025\nSala A'} className={inp} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right: Preview + Recipients + Send ── */}
      <div className="space-y-5">
        {/* Live preview */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vista previa en tiempo real</p>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner"
            style={{ backgroundColor: '#dfe7ec', backgroundImage: 'radial-gradient(circle, #c8d6dc 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
            <div className="p-4 min-h-[200px] flex flex-col gap-3">
              <WaPreviewBubble c={c} />
              <span className="self-end text-[10px] text-gray-500 bg-white/60 rounded px-1.5 py-0.5">12:00 PM ✓✓</span>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-[#25D366]" /> Destinatarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingContacts ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando contactos...
              </div>
            ) : (
              <>
                {[
                  { id: 'all_users', label: 'Todos los usuarios', count: contacts.users?.length ?? 0 },
                  { id: 'all_guests', label: 'Todos los invitados', count: contacts.guests?.length ?? 0 },
                ].map(g => (
                  <label key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:border-[#25D366] transition-colors">
                    <input type="checkbox" checked={recipients.includes(g.id)}
                      onChange={e => setRecipients(e.target.checked ? [...recipients, g.id] : recipients.filter(v => v !== g.id))}
                      className="w-4 h-4 accent-[#25D366] rounded" />
                    <span className="flex-1 text-sm text-gray-700">{g.label}</span>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{g.count}</span>
                  </label>
                ))}
                <p className="text-xs text-gray-400 pt-1">
                  Total: <strong className="text-gray-700">{totalSelected} contactos seleccionados</strong>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Send button */}
        <Button onClick={handleSend} disabled={sending || !connected || recipients.length === 0}
          className="w-full h-12 bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2 text-base font-bold shadow-md">
          {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : <><Send className="w-5 h-5" /> Enviar campaña</>}
        </Button>
        {!connected && <p className="text-xs text-center text-gray-400">Configura las credenciales en Configuración</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD SECTION
══════════════════════════════════════════════════════════════ */
function DashboardSection({ connected, contacts }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/marketing/whatsapp/stats').catch(() => ({ data: { data: null } })),
      api.get('/admin/marketing/campaigns?channel=whatsapp&limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([s, c]) => {
      setStats(s.data.data);
      setRecent(c.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Connection banner */}
      <div className={cn('flex items-center gap-3 p-4 rounded-2xl border',
        connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200')}>
        <div className={cn('w-3 h-3 rounded-full', connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500')} />
        <div className="flex-1">
          <p className={cn('text-sm font-semibold', connected ? 'text-green-800' : 'text-yellow-800')}>
            {connected ? 'API de WhatsApp Business conectada' : 'API no configurada'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {connected ? 'Lista para enviar mensajes y campañas masivas' : 'Ve a Configuración para agregar tus credenciales'}
          </p>
        </div>
        <div className={cn('flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg',
          connected ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white')}>
          {connected ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {connected ? 'Activo' : 'Sin configurar'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total enviados"  value={stats?.total_sent ?? 0}     icon={Send}         color="text-green-500"  trend={stats?.trend_sent} />
        <StatCard label="Entregados"      value={stats?.delivered ?? 0}      icon={CheckCheck}   color="text-blue-500"   />
        <StatCard label="Leídos"          value={stats?.read ?? 0}           icon={Eye}          color="text-violet-500" />
        <StatCard label="Fallidos"        value={stats?.failed ?? 0}         icon={XCircle}      color="text-red-500"    />
      </div>

      {/* Contacts summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{contacts.users?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Usuarios registrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{contacts.guests?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Invitados con teléfono</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" /> Campañas recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin campañas enviadas aún</p>
              <p className="text-xs mt-1">Crea tu primera campaña desde "Nueva campaña"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((camp, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{camp.subject || camp.message?.slice(0, 60) || 'Campaña'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(camp.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {camp.recipients_count ? ` · ${camp.recipients_count} destinatarios` : ''}
                    </p>
                  </div>
                  <StatusBadge status={camp.status} />
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
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/marketing/campaigns?channel=whatsapp')
      .then(r => setCampaigns(r.data.data || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
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
            <p className="text-xs mt-1">Las campañas enviadas aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Mensaje', 'Tipo', 'Destinatarios', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 max-w-[200px]">
                      <p className="truncate font-medium text-gray-800">{c.subject || c.message?.slice(0, 50) || '—'}</p>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-xs capitalize">{c.type || 'text'}</Badge>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{c.recipients_count ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
  const [tab, setTab] = useState('users');

  const list = tab === 'users' ? contacts.users : contacts.guests;
  const filtered = (list || []).filter(item => {
    const name = item.name || item.full_name || '';
    const phone = item.phone || item.whatsapp_number || '';
    const email = item.email || '';
    return !search || name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search) || email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o teléfono..." className="pl-9" />
        </div>
      </div>
      <div className="flex gap-2">
        {[{ v: 'users', l: `Usuarios (${contacts.users?.length ?? 0})` }, { v: 'guests', l: `Invitados (${contacts.guests?.length ?? 0})` }].map(({ v, l }) => (
          <button key={v} onClick={() => setTab(v)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
              tab === v ? 'bg-[#25D366] text-white border-[#25D366]' : 'bg-white text-gray-600 border-gray-200')}>
            {l}
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{search ? 'Sin resultados' : 'Sin contactos'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {(tab === 'users' ? ['Nombre', 'Email', 'Teléfono', 'Rol'] : ['Nombre', 'Email', 'Teléfono', 'Estado']).map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-xs font-bold text-[#25D366] flex-shrink-0">
                            {(item.name || item.full_name || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{item.name || item.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{item.email || '—'}</td>
                      <td className="py-3 px-4">
                        {item.phone || item.whatsapp_number
                          ? <span className="flex items-center gap-1 text-green-600 font-medium"><Phone className="w-3.5 h-3.5" />{item.phone || item.whatsapp_number}</span>
                          : <span className="text-gray-300 text-xs">Sin teléfono</span>}
                      </td>
                      <td className="py-3 px-4">
                        {tab === 'users'
                          ? <Badge variant="outline" className="text-xs">{item.role || 'user'}</Badge>
                          : <StatusBadge status={item.rsvp_status || 'pending'} />}
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
function SettingsSection({ onConnectedChange }) {
  const [config, setConfig] = useState({ phone_number_id: '', access_token: '', business_account_id: '', api_version: 'v19.0' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const upd = p => setConfig(prev => ({ ...prev, ...p }));

  useEffect(() => {
    api.get('/admin/marketing/whatsapp-config')
      .then(r => { const d = r.data.data || {}; setConfig(prev => ({ ...prev, ...d })); onConnectedChange(!!d.access_token && !!d.phone_number_id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/marketing/whatsapp-config', config);
      onConnectedChange(!!config.access_token && !!config.phone_number_id);
      toast({ title: 'Configuración guardada' });
    } catch (err) { toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      await api.post('/admin/marketing/whatsapp/test', config);
      setTestResult({ ok: true, msg: 'Conexión exitosa con la API de WhatsApp Business' });
    } catch (err) { setTestResult({ ok: false, msg: err.response?.data?.message || 'No se pudo conectar con la API' }); }
    finally { setTesting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#25D366]" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Key className="w-5 h-5 text-[#25D366]" /> Credenciales WhatsApp Business API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex gap-2 text-xs text-blue-700">
            <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>Obtén tus credenciales en <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Meta for Developers</a> → Tu App → WhatsApp → API Setup.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone Number ID</Label>
              <Input value={config.phone_number_id} onChange={e => upd({ phone_number_id: e.target.value })} placeholder="1234567890" />
            </div>
            <div className="space-y-1.5">
              <Label>Business Account ID</Label>
              <Input value={config.business_account_id} onChange={e => upd({ business_account_id: e.target.value })} placeholder="9876543210" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Access Token <span className="text-gray-400 text-xs">(permanente, no el temporal)</span></Label>
              <div className="relative">
                <Input type="password" value={config.access_token} onChange={e => upd({ access_token: e.target.value })} placeholder="EAAxxxxx..." className="pr-10" />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Versión de API</Label>
              <Input value={config.api_version} onChange={e => upd({ api_version: e.target.value })} placeholder="v19.0" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="w-4 h-4" /> Guardar</>}
            </Button>
            <Button onClick={handleTest} disabled={testing || !config.access_token} variant="outline" className="gap-2">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Probar conexión
            </Button>
          </div>
          {testResult && (
            <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm border mt-2',
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

/* ── Hamburger icon (inline SVG, no extra import needed) ── */
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
export default function AdminWhatsAppPage() {
  const [section, setSection]         = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connected, setConnected]     = useState(false);
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

  const Sidebar = (
    <div className="flex flex-col h-full bg-[#111b21]">
      {/* WA header */}
      <div className="p-4 border-b border-[#222d34] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center shadow flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold leading-tight">WhatsApp</p>
            <p className="text-[#8696a0] text-[10px]">Business Marketing</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-[#8696a0] hover:text-white hover:bg-[#222d34] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => navTo(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap',
              section === id ? 'bg-[#25D366] text-white' : 'text-[#8696a0] hover:bg-[#222d34] hover:text-white'
            )}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {section === id && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />}
          </button>
        ))}
      </nav>

      {/* Status footer */}
      <div className="p-3 border-t border-[#222d34]">
        <div className="flex items-center gap-2 px-1">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0 transition-colors', connected ? 'bg-[#25D366]' : 'bg-gray-500')} />
          <span className={cn('text-[11px] font-semibold truncate', connected ? 'text-[#25D366]' : 'text-gray-500')}>
            {connected ? 'API conectada' : 'Sin configurar'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col">
        {Sidebar}
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex-shrink-0 flex flex-col shadow-2xl">
            {Sidebar}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <HamburgerIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {SECTIONS.find(s => s.id === section)?.label}
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">WhatsApp Business Marketing</p>
          </div>
          {section !== 'compose' && (
            <Button size="sm" onClick={() => navTo('compose')}
              className="bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2 flex-shrink-0 text-xs sm:text-sm">
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva campaña</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          )}
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {section === 'dashboard' && <DashboardSection connected={connected} contacts={contacts} />}
            {section === 'compose'   && <ComposerSection connected={connected} contacts={contacts} loadingContacts={loadingContacts} />}
            {section === 'campaigns' && <CampaignsSection />}
            {section === 'contacts'  && <ContactsSection contacts={contacts} loading={loadingContacts} />}
            {section === 'settings'  && <SettingsSection onConnectedChange={setConnected} />}
            {section === 'templates' && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-semibold text-lg">Gestión de Templates</p>
                <p className="text-sm mt-2 max-w-sm text-center">
                  Los templates aprobados en Meta Business Manager se gestionan desde el portal oficial.
                </p>
                <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:bg-[#1ebe57] transition-colors shadow">
                  <Link2 className="w-4 h-4" /> Ir a Meta Business Manager
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
