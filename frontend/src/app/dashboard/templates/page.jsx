'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Layers, Search, Eye, Plus, Loader2, Lock, AlertCircle,
  X, Smartphone, Monitor, Paintbrush2, Tag, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { SECTION_COMPONENTS } from '@/app/dashboard/builder/[id]/section-types';
import { getDefaultProps } from '@/app/dashboard/builder/[id]/config/sectionTypes';
import { getSectionBgStyle, getBodyBgStyle } from '@/app/dashboard/builder/[id]/utils/bgStyles';

/* ─── New Invitation Modal ──────────────────────────────────── */
function NewInvitationModal({ template, onClose, router }) {
  const [title, setTitle]   = useState('');
  const [eventId, setEventId] = useState('');
  const [events, setEvents]   = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    dataCache.fetchers.events().then(setEvents).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !eventId) return;
    setSaving(true);
    try {
      const { data } = await api.post('/invitations', {
        title: title.trim(),
        event_id: eventId,
        template_id: template.id,
      });
      toast({ title: 'Invitación creada', description: 'Abriendo el builder...' });
      dataCache.invalidate('/invitations');
      router.push(`/dashboard/builder/${data.data.id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nueva Invitación</h2>
            <p className="text-xs text-gray-400 mt-0.5">Plantilla: <span className="font-semibold text-violet-600">{template.name}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-title">Título</Label>
            <Input
              id="inv-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Invitación boda Ana y Carlos"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-event">Evento</Label>
            <select
              id="inv-event"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              required
            >
              <option value="">Selecciona un evento</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>

          {/* Template preview strip */}
          {template.preview_image && (
            <div className="rounded-xl overflow-hidden border border-gray-100 h-24">
              <img src={template.preview_image} alt={template.name} className="w-full h-full object-cover object-top" />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={saving || !title.trim() || !eventId}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : <><Plus className="w-4 h-4" /> Crear y diseñar</>}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────── */
const CATEGORIES = ['Todos', 'Boda', 'Cumpleaños', 'Quinceañera', 'Corporativo', 'Graduación', 'Baby Shower', 'Otro'];

const CATEGORY_COLORS = {
  'Boda':        'bg-pink-100 text-pink-700 border-pink-200',
  'Cumpleaños':  'bg-orange-100 text-orange-700 border-orange-200',
  'Quinceañera': 'bg-purple-100 text-purple-700 border-purple-200',
  'Corporativo': 'bg-blue-100 text-blue-700 border-blue-200',
  'Graduación':  'bg-green-100 text-green-700 border-green-200',
  'Baby Shower': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Otro':        'bg-gray-100 text-gray-600 border-gray-200',
};

function parseJson(base_json) {
  if (!base_json) return { sections: [], theme: {} };
  try {
    const p = typeof base_json === 'string' ? JSON.parse(base_json) : base_json;
    return { sections: p.sections || [], theme: p.theme || {} };
  } catch { return { sections: [], theme: {} }; }
}

/* ─── Estimated heights (free canvas) ───────────────────────── */
const BLOCK_H = {
  hero: 350, divider: 50, text: 150, quote: 130,
  gallery: 450, gifts: 320, schedule: 650, countdown: 200,
  map: 300, rsvp: 280, music_player: 100, couple: 280,
  video: 300, hospedaje: 250, dress_code: 200, confirm: 250,
  photo_upload: 400, menu_event: 250, image: 300, mask: 360,
};
const FREE_W = 390;

/* ─── Mini free-canvas renderer for preview ─────────────────── */
function MiniCanvas({ sections, theme, scale }) {
  const bodyStyle = getBodyBgStyle(theme);
  const fontFamily = theme?.fontFamily ? `"${theme.fontFamily}", serif` : undefined;

  const canvasH = Math.max(600, ...sections.map(s => {
    const y = s.props?.y ?? 0;
    const h = s.props?.layerH ?? BLOCK_H[s.type] ?? 200;
    return y + h + 80;
  }));

  const sorted = [...sections]
    .filter(s => !s.props?.layerHidden)
    .sort((a, b) => (a.props?.zIndex ?? 1) - (b.props?.zIndex ?? 1));

  return (
    <div style={{ width: FREE_W * scale, height: canvasH * scale, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{
        position: 'relative', width: FREE_W, height: canvasH,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        fontFamily, ...bodyStyle,
        '--theme-primary': theme?.primary || '#FF4D8F',
        '--theme-secondary': theme?.secondary || '#7c3aed',
        '--theme-background': theme?.background || '#ffffff',
        '--theme-text': theme?.text || '#1a1a2e',
      }}>
        {sorted.map((section, i) => {
          const SectionComp = SECTION_COMPONENTS[section.type];
          if (!SectionComp) return null;
          const props = { ...getDefaultProps(section.type), ...section.props };
          const bgStyle = getSectionBgStyle(props);
          return (
            <div key={section.id || i} className="section-typography-wrapper" style={{
              position: 'absolute',
              left: section.props?.x ?? 0, top: section.props?.y ?? 0,
              width: section.props?.layerW ?? FREE_W,
              height: section.props?.layerH ?? undefined,
              zIndex: section.props?.zIndex ?? 1,
              overflow: 'hidden', boxSizing: 'border-box',
              '--title-font': props.titleFont ? `"${props.titleFont}", serif` : fontFamily || 'inherit',
              '--text-font': props.textFont ? `"${props.textFont}", sans-serif` : fontFamily || 'inherit',
            }}>
              <div style={{ position: 'relative' }}>
                {bgStyle && <div style={bgStyle} />}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <SectionComp props={props} theme={theme} isPreview invitationId={null} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Stack renderer for preview ────────────────────────────── */
function StackRenderer({ sections, theme }) {
  return (
    <div style={getBodyBgStyle(theme)}>
      {sections.map((section, i) => {
        const SectionComp = SECTION_COMPONENTS[section.type];
        if (!SectionComp) return null;
        const props = { ...getDefaultProps(section.type), ...section.props };
        const bgStyle = getSectionBgStyle(props);
        return (
          <div key={section.id || i} style={{ position: 'relative' }}>
            {bgStyle && <div style={bgStyle} />}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionComp props={props} theme={theme} isPreview invitationId={null} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Preview Modal ─────────────────────────────────────────── */
function PreviewModal({ template, onClose, onUse, canUse }) {
  const [device, setDevice] = useState('mobile');
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/templates/${template.id}`)
      .then(r => setFull(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [template.id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const { sections, theme } = parseJson(full?.base_json || template.base_json);
  const isFree = theme?.canvasMode === 'free';
  const PHONE_INNER = 300;
  const phoneScale = PHONE_INNER / FREE_W;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{template.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {template.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {template.category}
                  </span>
                )}
                <span className="text-xs text-gray-400">{sections.length} sección{sections.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-lg transition-all ${device === 'mobile' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>
                <Smartphone className="w-4 h-4" />
              </button>
              <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-lg transition-all ${device === 'desktop' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            {canUse ? (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5" onClick={() => onUse(template)}>
                <Plus className="w-3.5 h-3.5" /> Usar plantilla
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5 text-gray-400" disabled>
                <Lock className="w-3.5 h-3.5" /> Sin acceso
              </Button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm font-medium">Cargando plantilla...</p>
            </div>
          ) : device === 'desktop' ? (
            <div className="flex justify-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 overflow-y-auto" style={{ width: FREE_W, maxHeight: '65vh', ...getBodyBgStyle(theme) }}>
                {isFree
                  ? <MiniCanvas sections={sections} theme={theme} scale={1} />
                  : <StackRenderer sections={sections} theme={theme} />}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div style={{ width: 320 }}>
                <div className="relative bg-gray-900 border-[10px] border-gray-800 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden">
                  <div className="absolute top-0 inset-x-0 flex justify-center z-20 pt-1">
                    <div className="w-20 h-4 bg-gray-900 rounded-b-xl" />
                  </div>
                  <div style={{ width: PHONE_INNER, overflowX: 'hidden' }}>
                    {sections.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ height: 500 }}>
                        <Layers className="w-10 h-10 text-gray-300" />
                        <p className="text-sm text-gray-400">Sin secciones</p>
                      </div>
                    ) : isFree ? (
                      <MiniCanvas sections={sections} theme={theme} scale={phoneScale} />
                    ) : (
                      <StackRenderer sections={sections} theme={theme} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400 truncate max-w-xs">
            {sections.length > 0 ? sections.map(s => s.type).join(' · ') : 'Sin secciones'}
          </p>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-medium ml-4">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Template Card ─────────────────────────────────────────── */
function TemplateCard({ template, canUse, onPreview, onUse }) {
  return (
    <Card className={`group overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${!canUse ? 'opacity-70' : ''}`}>
      {/* Thumbnail */}
      <div
        className="relative h-48 bg-gradient-to-br from-violet-50 to-purple-100 overflow-hidden cursor-pointer"
        onClick={() => onPreview(template)}
      >
        {template.preview_image ? (
          <img src={template.preview_image} alt={template.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layers className="w-12 h-12 text-violet-300" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onPreview(template); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-gray-800 text-xs font-semibold shadow hover:bg-white transition-colors">
              <Eye className="w-3.5 h-3.5" /> Vista previa
            </button>
            {canUse && (
              <button onClick={(e) => { e.stopPropagation(); onUse(template); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/90 text-white text-xs font-semibold shadow hover:bg-violet-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Usar
              </button>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {template.category && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {template.category}
            </span>
          )}
        </div>

        {!canUse && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-900/80 text-white font-semibold">
              <Lock className="w-2.5 h-2.5" /> Plan requerido
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {template.has_content ? 'Con diseño' : 'Plantilla vacía'}
            </p>
          </div>
          {canUse ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Lock className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => onPreview(template)}>
            <Eye className="w-3.5 h-3.5" /> Vista previa
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => onUse(template)}
            disabled={!canUse}
          >
            {canUse ? <><Plus className="w-3.5 h-3.5" /> Usar</> : <><Lock className="w-3.5 h-3.5" /> Bloqueado</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function UserTemplatesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [templates, setTemplates] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [useTemplate, setUseTemplate]         = useState(null);

  useEffect(() => {
    Promise.all([
      dataCache.fetchers.templates(),
      dataCache.fetchers.subscription().catch(() => null),
    ]).then(([tmplData, subData]) => {
      setTemplates((tmplData || []).filter(t => t.is_active));
      setSubscription(subData);
    }).catch(() => {
      toast({ variant: 'destructive', title: 'Error al cargar plantillas' });
    }).finally(() => setLoading(false));
  }, []);

  /* ── Permission check ──
     canUse = true when:
     - User has an active subscription (any plan allows templates by default)
     - OR user is admin/superadmin
     Extend this logic as you add template-specific permissions to plans.
  */
  const hasActiveSub = subscription?.status === 'active';
  const isAdmin = ['SuperAdmin', 'Admin', 'Support'].includes(user?.role);
  const canUseTemplates = isAdmin || hasActiveSub;

  /* Check specific permission key if the plan defines it */
  const planPermKeys = (subscription?.permissions || []).map(p => p.key_name || p.name || '');
  const hasTemplatesPerm = planPermKeys.length === 0
    ? canUseTemplates
    : canUseTemplates && (planPermKeys.some(k => k.includes('template')) || planPermKeys.length > 0);

  const handleUse = useCallback((template) => {
    if (!hasTemplatesPerm) {
      toast({ variant: 'destructive', title: 'Sin acceso', description: 'Necesitas un plan activo para usar plantillas.' });
      return;
    }
    setUseTemplate(template);
  }, [hasTemplatesPerm]);

  const filtered = templates.filter(t => {
    const matchCat = category === 'Todos' || t.category === category;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plantillas</h1>
          <p className="text-gray-500 mt-1">Elige una plantilla base para tu invitación</p>
        </div>
        {!hasActiveSub && !isAdmin && (
          <Button onClick={() => router.push('/dashboard/subscription')} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Paintbrush2 className="w-4 h-4" /> Activar plan
          </Button>
        )}
      </div>

      {/* No subscription warning */}
      {!hasActiveSub && !isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-orange-900">Necesitas un plan activo</p>
              <p className="text-sm text-orange-700 mt-0.5">
                Activa o renueva tu plan para poder usar las plantillas disponibles.
              </p>
            </div>
            <Button size="sm" onClick={() => router.push('/dashboard/subscription')}
              className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white">
              Ver planes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active sub info */}
      {hasActiveSub && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Plan <strong>{subscription.plan_name}</strong> activo — todas las plantillas disponibles</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                category === cat
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Sin plantillas</p>
            <p className="text-sm text-gray-400 mt-1">No hay plantillas disponibles para los filtros seleccionados</p>
          </div>
          {(search || category !== 'Todos') && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCategory('Todos'); }}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{filtered.length} plantilla{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                canUse={hasTemplatesPerm}
                onPreview={setPreviewTemplate}
                onUse={handleUse}
              />
            ))}
          </div>
        </>
      )}

      {/* Preview modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          canUse={hasTemplatesPerm}
          onClose={() => setPreviewTemplate(null)}
          onUse={(t) => { setPreviewTemplate(null); handleUse(t); }}
        />
      )}

      {useTemplate && (
        <NewInvitationModal
          template={useTemplate}
          onClose={() => setUseTemplate(null)}
          router={router}
        />
      )}
    </div>
  );
}
