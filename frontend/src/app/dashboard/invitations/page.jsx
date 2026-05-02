'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Mail, Eye, Pencil, Trash2, Globe, FileText,
  ExternalLink, X, Smartphone, Monitor, Loader2, Layers, Upload,
} from 'lucide-react';
import NoPlanBanner from '@/components/ui/no-plan-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { formatDate, truncate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SECTION_COMPONENTS } from '@/app/dashboard/builder/[id]/section-types';
import { getDefaultProps } from '@/app/dashboard/builder/[id]/config/sectionTypes';
import { getSectionBgStyle, getBodyBgStyle } from '@/app/dashboard/builder/[id]/utils/bgStyles';

/* ─── helpers ───────────────────────────────────────────────── */
const BLOCK_H = {
  hero: 350, divider: 50, text: 150, quote: 130,
  gallery: 450, gifts: 320, schedule: 650, countdown: 200,
  map: 300, rsvp: 280, music_player: 100, couple: 280,
  video: 300, hospedaje: 250, dress_code: 200, confirm: 250,
  photo_upload: 400, menu_event: 250, image: 300, mask: 360,
};
const FREE_W = 390;

function parseBuilderJson(builder_json) {
  if (!builder_json) return { sections: [], theme: {} };
  try {
    const p = typeof builder_json === 'string' ? JSON.parse(builder_json) : builder_json;
    return { sections: p.sections || [], theme: p.theme || {} };
  } catch { return { sections: [], theme: {} }; }
}

/* ─── Mini free-canvas renderer ─────────────────────────────── */
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

/* ─── Card thumbnail — responsive live render ───────────────── */
function InvitationCardThumbnail({ invitationId }) {
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(0);
  const [data, setData]       = useState(null);
  const [fetched, setFetched] = useState(false);

  /* Measure real container width (responds to grid resize) */
  useEffect(() => {
    if (!containerRef.current) return;
    setContainerW(containerRef.current.offsetWidth);
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* Fetch builder_json once */
  useEffect(() => {
    let cancelled = false;
    api.get(`/invitations/${invitationId}`)
      .then(r => { if (!cancelled) setData(r.data.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFetched(true); });
    return () => { cancelled = true; };
  }, [invitationId]);

  const scale = containerW > 0 ? containerW / FREE_W : 1;
  const { sections, theme } = parseBuilderJson(data?.builder_json);
  const isFree = theme?.canvasMode === 'free';

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Loading skeleton */}
      {!fetched && (
        <div className="w-full h-full bg-gradient-to-br from-violet-50 to-purple-100 animate-pulse" />
      )}

      {/* No design yet */}
      {fetched && sections.length === 0 && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-50 to-purple-100">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
            <Mail className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-xs text-violet-300 font-medium">Sin diseño</p>
        </div>
      )}

      {/* Live scaled render — fills the card width exactly */}
      {fetched && sections.length > 0 && containerW > 0 && (
        isFree
          ? <MiniCanvas sections={sections} theme={theme} scale={scale} />
          : (
            <div style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: FREE_W,
            }}>
              <StackRenderer sections={sections} theme={theme} />
            </div>
          )
      )}
    </div>
  );
}

/* ─── Preview Modal ─────────────────────────────────────────── */
function InvitationPreviewModal({ invitation, onClose }) {
  const [device, setDevice] = useState('mobile');
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/invitations/${invitation.id}`)
      .then(r => setFull(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invitation.id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const { sections, theme } = parseBuilderJson(full?.builder_json);
  const isFree = theme?.canvasMode === 'free';
  const PHONE_INNER = 300;
  const phoneScale = PHONE_INNER / FREE_W;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{invitation.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{invitation.event_name}</p>
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
            <Link href={`/dashboard/builder/${invitation.id}`}>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Builder
              </Button>
            </Link>
            {invitation.status === 'published' && (
              <a href={`/i/${invitation.slug}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Ver
                </Button>
              </a>
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
              <p className="text-sm font-medium">Cargando invitación...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Sin diseño aún</p>
                <p className="text-sm text-gray-400 mt-1">Usa el Builder para diseñar esta invitación</p>
              </div>
              <Link href={`/dashboard/builder/${invitation.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Ir al Builder
                </Button>
              </Link>
            </div>
          ) : device === 'desktop' ? (
            <div className="flex justify-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 overflow-y-auto"
                style={{ width: FREE_W, maxHeight: '65vh', ...getBodyBgStyle(theme) }}>
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
                    {isFree
                      ? <MiniCanvas sections={sections} theme={theme} scale={phoneScale} />
                      : <StackRenderer sections={sections} theme={theme} />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {sections.length > 0 ? `${sections.length} sección${sections.length !== 1 ? 'es' : ''}` : 'Sin contenido'}
          </p>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

const emptyForm = { event_id: '', title: '', template_id: '' };

export default function InvitationsPage() {
  const searchParams = useSearchParams();
  const [invitations, setInvitations] = useState([]);
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noPlan, setNoPlan]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, event_id: searchParams.get('event_id') || '' });
  const [saving, setSaving] = useState(false);
  const [previewInv, setPreviewInv] = useState(null);

  const fetchAll = async () => {
    try {
      // Las 3 llamadas van al cache (instantáneas si hubo prefetch en hover)
      const [invData, evData, tmplData] = await Promise.all([
        dataCache.fetchers.invitations(),
        dataCache.fetchers.events(),
        dataCache.fetchers.templates(),
      ]);
      setInvitations(invData);
      setEvents(evData);
      setTemplates(tmplData);
    } catch (err) {
      if (err.response?.status === 403) setNoPlan(true);
      else toast({ variant: 'destructive', title: 'Error al cargar datos' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/invitations', form);
      toast({ title: 'Invitación creada', description: 'Ahora puedes diseñarla con el builder' });
      setShowForm(false);
      setForm(emptyForm);
      // Agrega la nueva invitación al estado local (evita recargar todo)
      setInvitations(prev => [data.data, ...prev]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handlePublish = async (id, currentStatus) => {
    try {
      const action = currentStatus === 'published' ? 'unpublish' : 'publish';
      await api.patch(`/invitations/${id}/${action}`);
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      toast({ title: currentStatus === 'published' ? 'Invitación despublicada' : 'Invitación publicada' });
      // Actualiza solo el item modificado en el estado local
      setInvitations(prev =>
        prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv)
      );
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta invitación?')) return;
    try {
      await api.delete(`/invitations/${id}`);
      toast({ title: 'Invitación eliminada' });
      // Filtra el item eliminado del estado local
      setInvitations(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  // ══════════════════════════════════════════════════════════════
  // GLOBAL IMPORT - Create new invitation from .plan file
  // ══════════════════════════════════════════════════════════════
  const handleGlobalImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.plan';
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file extension
      if (!file.name.endsWith('.plan')) {
        toast({ 
          variant: 'destructive', 
          title: 'Archivo inválido', 
          description: 'Solo se permiten archivos .plan' 
        });
        return;
      }

      try {
        const text = await file.text();
        const templateData = JSON.parse(text);

        // Validate structure
        if (!templateData.sections || !Array.isArray(templateData.sections)) {
          throw new Error('Formato de plantilla inválido - falta el array de secciones');
        }

        if (!templateData.version) {
          throw new Error('Formato de plantilla inválido - falta la versión');
        }

        // Extract name from file or template data
        const defaultTitle = templateData.invitation?.title || file.name.replace('.plan', '');
        const invitationTitle = prompt(
          `Título para la nueva invitación:\n\n` +
          `Se importarán ${templateData.sections.length} secciones.`,
          defaultTitle
        );
        
        if (!invitationTitle || !invitationTitle.trim()) {
          toast({ title: 'Importación cancelada' });
          return;
        }

        // Prepare builder_json
        const builderJson = {
          sections: templateData.sections,
          theme: templateData.theme || {},
        };

        // Create new invitation with imported content
        const { data } = await api.post('/invitations', {
          title: invitationTitle.trim(),
          type: templateData.invitation?.type || 'boda',
          event_id: form.event_id || null,
        });

        const newInvitationId = data.data.id;

        // Update with imported content
        await api.put(`/invitations/${newInvitationId}`, {
          builder_json: JSON.stringify(builderJson),
        });

        toast({ 
          title: '✓ Invitación importada', 
          description: `"${invitationTitle}" creada con ${templateData.sections.length} secciones` 
        });

        // Add to local state
        setInvitations(prev => [data.data, ...prev]);
        
        // Refresh to get updated data
        fetchAll();
      } catch (error) {
        console.error('Error importing invitation:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Error al importar invitación', 
          description: error.message || 'El archivo no es una plantilla válida' 
        });
      }
    };

    input.click();
  };
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  if (noPlan) return <NoPlanBanner description="Tu plan no tiene permiso para usar este módulo o aún no cuentas con un plan activo. Elige un plan para crear invitaciones." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invitaciones</h1>
          <p className="text-gray-500 mt-1">Crea y gestiona tus invitaciones digitales</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleGlobalImport}
            className="gap-2"
          >
            <Upload className="w-4 h-4" /> Importar
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Invitación
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nueva Invitación</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  required placeholder="Invitación a la boda de Ana y Carlos" />
              </div>
              <div>
                <Label>Evento</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.event_id}
                  onChange={e => setForm({ ...form, event_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona un evento</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Plantilla (opcional)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.template_id}
                  onChange={e => setForm({ ...form, template_id: e.target.value })}
                >
                  <option value="">Sin plantilla (lienzo en blanco)</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear invitación'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Card key={i}><CardContent className="h-48 animate-pulse bg-gray-100 rounded-lg m-4" /></Card>)}
        </div>
      ) : invitations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No tienes invitaciones aún</p>
            <p className="text-gray-400 text-sm mt-1">Crea tu primera invitación digital</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Crear invitación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {invitations.map(inv => (
            <Card key={inv.id} className="group overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
              {/* Thumbnail */}
              <div
                className="relative h-48 bg-gradient-to-br from-violet-50 to-purple-100 overflow-hidden cursor-pointer"
                onClick={() => setPreviewInv(inv)}
              >
                <InvitationCardThumbnail invitationId={inv.id} />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewInv(inv); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-gray-800 text-xs font-semibold shadow hover:bg-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Vista previa
                    </button>
                    <Link href={`/dashboard/builder/${inv.id}`} onClick={e => e.stopPropagation()}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/90 text-white text-xs font-semibold shadow hover:bg-violet-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Builder
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant={inv.status === 'published' ? 'success' : 'secondary'} className="text-[11px]">
                    {inv.status === 'published' ? 'Publicada' : 'Borrador'}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{inv.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{inv.event_name}</p>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => handlePublish(inv.id, inv.status)}
                  >
                    {inv.status === 'published'
                      ? <><FileText className="w-3.5 h-3.5" /> Borrador</>
                      : <><Globe className="w-3.5 h-3.5" /> Publicar</>}
                  </Button>
                  {inv.status === 'published' && (
                    <a href={`/i/${inv.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-violet-600">
                        <ExternalLink className="w-3.5 h-3.5" /> Ver
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm" variant="ghost"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                    onClick={() => handleDelete(inv.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewInv && (
        <InvitationPreviewModal
          invitation={previewInv}
          onClose={() => setPreviewInv(null)}
        />
      )}
    </div>
  );
}
