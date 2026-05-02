'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, FileImage, Pencil, Trash2, Eye, EyeOff, Paintbrush2,
  X, Smartphone, Monitor, Layers, ZoomIn, Camera, Loader2, Download, Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { SECTION_COMPONENTS } from '@/app/dashboard/builder/[id]/section-types';
import { getDefaultProps } from '@/app/dashboard/builder/[id]/config/sectionTypes';
import { getSectionBgStyle, getBodyBgStyle } from '@/app/dashboard/builder/[id]/utils/bgStyles';

/* ─── constants ─────────────────────────────────────────────── */
const emptyForm = { name: '', category: '', is_active: 1 };
const CATEGORIES = ['Boda', 'Cumpleaños', 'Quinceañera', 'Corporativo', 'Graduación', 'Baby Shower', 'Otro'];
const CATEGORY_COLORS = {
  'Boda':        'bg-pink-100 text-pink-700',
  'Cumpleaños':  'bg-orange-100 text-orange-700',
  'Quinceañera': 'bg-purple-100 text-purple-700',
  'Corporativo': 'bg-blue-100 text-blue-700',
  'Graduación':  'bg-green-100 text-green-700',
  'Baby Shower': 'bg-cyan-100 text-cyan-700',
  'Otro':        'bg-gray-100 text-gray-600',
};

/* ─── helpers ───────────────────────────────────────────────── */
function parseTemplateJson(base_json) {
  if (!base_json) return { sections: [], theme: {} };
  try {
    const parsed = typeof base_json === 'string' ? JSON.parse(base_json) : base_json;
    return { sections: parsed.sections || [], theme: parsed.theme || {} };
  } catch {
    return { sections: [], theme: {} };
  }
}

/* ─── Section renderer ──────────────────────────────────────── */
function SectionRenderer({ section, theme }) {
  const SectionComp = SECTION_COMPONENTS[section.type];
  if (!SectionComp) return null;
  const props = { ...getDefaultProps(section.type), ...section.props };
  const bgStyle = getSectionBgStyle(props);
  return (
    <div style={{ position: 'relative' }}>
      {bgStyle && <div style={bgStyle} />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SectionComp props={props} theme={theme} isPreview invitationId={null} />
      </div>
    </div>
  );
}

/* ─── Offscreen render container ───────────────────────────── */
// Renders sections into a hidden div for html2canvas capture.
// Supports both stack and free-canvas layouts.
function OffscreenRenderer({ sections, theme, containerRef }) {
  const bodyStyle = getBodyBgStyle(theme);
  const fontFamily = theme?.fontFamily ? `"${theme.fontFamily}", serif` : 'sans-serif';
  const isFree = theme?.canvasMode === 'free';

  const canvasH = isFree
    ? Math.max(600, ...sections.map(s => {
        const y = s.props?.y ?? 0;
        const h = s.props?.layerH ?? PREVIEW_BLOCK_H[s.type] ?? 200;
        return y + h + 80;
      }))
    : undefined;

  const sorted = isFree
    ? [...sections]
        .filter(s => !s.props?.layerHidden)
        .sort((a, b) => (a.props?.zIndex ?? 1) - (b.props?.zIndex ?? 1))
    : sections;

  const themeVars = {
    '--theme-primary':    theme?.primary    || '#FF4D8F',
    '--theme-secondary':  theme?.secondary  || '#7c3aed',
    '--theme-background': theme?.background || '#ffffff',
    '--theme-text':       theme?.text       || '#1a1a2e',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '-9999px',
        zIndex: -1,
        pointerEvents: 'none',
        visibility: 'hidden',
      }}
    >
      {/* Inner container is what html2canvas captures via ref */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: FREE_CANVAS_W,
          height: isFree ? canvasH : undefined,
          fontFamily,
          ...bodyStyle,
          ...themeVars,
        }}
      >
        {isFree ? sorted.map((section, i) => {
          const SectionComp = SECTION_COMPONENTS[section.type];
          if (!SectionComp) return null;
          const props = { ...getDefaultProps(section.type), ...section.props };
          const bgStyle = getSectionBgStyle(props);
          return (
            <div
              key={section.id || i}
              style={{
                position: 'absolute',
                left: section.props?.x ?? 0,
                top:  section.props?.y ?? 0,
                width: section.props?.layerW ?? FREE_CANVAS_W,
                height: section.props?.layerH ?? undefined,
                zIndex: section.props?.zIndex ?? 1,
                overflow: 'hidden',
                boxSizing: 'border-box',
                '--title-font': props.titleFont ? `"${props.titleFont}", serif` : fontFamily || 'inherit',
                '--text-font':  props.textFont  ? `"${props.textFont}", sans-serif` : fontFamily || 'inherit',
              }}
            >
              <div style={{ position: 'relative' }}>
                {bgStyle && <div style={bgStyle} />}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <SectionComp props={props} theme={theme} isPreview invitationId={null} />
                </div>
              </div>
            </div>
          );
        }) : sections.map((section, i) => (
          <SectionRenderer key={section.id || i} section={section} theme={theme} />
        ))}
      </div>
    </div>
  );
}

/* ─── Estimated block heights for free-mode canvas height ───── */
const PREVIEW_BLOCK_H = {
  hero: 350, divider: 50, text: 150, quote: 130,
  gallery: 450, gifts: 320, schedule: 650, countdown: 200,
  map: 300, rsvp: 280, music_player: 100, couple: 280,
  video: 300, hospedaje: 250, dress_code: 200, confirm: 250,
  photo_upload: 400, menu_event: 250, image: 300, mask: 360,
};

/* ─── Free-canvas sections renderer (respects x/y/zIndex) ───── */
const FREE_CANVAS_W = 390;
function FreeSectionsCanvas({ sections, theme, scale = 1 }) {
  const bodyStyle = getBodyBgStyle(theme);
  const fontFamily = theme?.fontFamily ? `"${theme.fontFamily}", serif` : undefined;

  const canvasH = Math.max(
    600,
    ...sections.map(s => {
      const y = s.props?.y ?? 0;
      const h = s.props?.layerH ?? PREVIEW_BLOCK_H[s.type] ?? 200;
      return y + h + 80;
    })
  );

  const sorted = [...sections]
    .filter(s => !s.props?.layerHidden)
    .sort((a, b) => (a.props?.zIndex ?? 1) - (b.props?.zIndex ?? 1));

  const themeVars = {
    '--theme-primary':    theme?.primary    || '#FF4D8F',
    '--theme-secondary':  theme?.secondary  || '#7c3aed',
    '--theme-background': theme?.background || '#ffffff',
    '--theme-text':       theme?.text       || '#1a1a2e',
  };

  return (
    // Outer wrapper: takes up exactly the scaled space so surrounding layout is correct
    <div style={{ width: FREE_CANVAS_W * scale, height: canvasH * scale, flexShrink: 0, overflow: 'hidden' }}>
      {/* Inner canvas: rendered at full 390px then scaled down */}
      <div
        style={{
          position: 'relative',
          width: FREE_CANVAS_W,
          height: canvasH,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          fontFamily,
          ...bodyStyle,
          ...themeVars,
        }}
      >
        {sorted.map((section, i) => {
          const SectionComp = SECTION_COMPONENTS[section.type];
          if (!SectionComp) return null;
          const props = { ...getDefaultProps(section.type), ...section.props };
          const bgStyle = getSectionBgStyle(props);
          return (
            <div
              key={section.id || i}
              className="section-typography-wrapper"
              style={{
                position: 'absolute',
                left: section.props?.x ?? 0,
                top:  section.props?.y ?? 0,
                width: section.props?.layerW ?? FREE_CANVAS_W,
                height: section.props?.layerH ?? undefined,
                zIndex: section.props?.zIndex ?? 1,
                overflow: 'hidden',
                boxSizing: 'border-box',
                '--title-font': props.titleFont ? `"${props.titleFont}", serif` : fontFamily || 'inherit',
                '--text-font':  props.textFont  ? `"${props.textFont}", sans-serif` : fontFamily || 'inherit',
              }}
            >
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

/* ─── Preview frame (modal) ─────────────────────────────────── */
function PreviewFrame({ sections, theme, device }) {
  const bodyStyle = getBodyBgStyle(theme);
  const isFree = theme?.canvasMode === 'free';

  if (device === 'desktop') {
    return (
      <div className="flex justify-center">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
          style={{ ...bodyStyle, width: FREE_CANVAS_W, maxHeight: '70vh', overflowY: 'auto' }}
        >
          {isFree ? (
            <FreeSectionsCanvas sections={sections} theme={theme} scale={1} />
          ) : (
            sections.map((s, i) => <SectionRenderer key={s.id || i} section={s} theme={theme} />)
          )}
        </div>
      </div>
    );
  }

  // Mobile — phone mock at 320px outer (300px inner)
  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: 320 }}>
        <div
          className="relative bg-gray-900 border-[10px] border-gray-800 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Notch */}
          <div className="absolute top-0 inset-x-0 flex justify-center z-20 pt-1">
            <div className="w-20 h-4 bg-gray-900 rounded-b-xl" />
          </div>
          {/* Screen — no height cap, let the frame grow to full content height */}
          <div style={{ width: 300, overflowX: 'hidden' }}>
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ height: 500, ...bodyStyle }}>
                <Layers className="w-10 h-10 text-gray-300" />
                <p className="text-sm text-gray-400 font-medium">Sin secciones</p>
              </div>
            ) : isFree ? (
              <FreeSectionsCanvas sections={sections} theme={theme} scale={300 / 390} />
            ) : (
              <div style={bodyStyle}>
                {sections.map((s, i) => <SectionRenderer key={s.id || i} section={s} theme={theme} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Preview Modal ─────────────────────────────────────────── */
function PreviewModal({ template, onClose }) {
  const [device, setDevice] = useState('mobile');
  const [full, setFull] = useState(null);
  const [loadingFull, setLoadingFull] = useState(true);
  const router = useRouter();

  // Fetch full template to get base_json (list API omits it for perf)
  useEffect(() => {
    api.get(`/templates/${template.id}`)
      .then(r => setFull(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingFull(false));
  }, [template.id]);

  const { sections, theme } = parseTemplateJson(full?.base_json || template.base_json);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
              <h2 className="font-bold text-gray-900 truncate">{template.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {template.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-600'}`}>
                    {template.category}
                  </span>
                )}
                <span className="text-xs text-gray-400">{sections.length} sección{sections.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-lg transition-all ${device === 'mobile' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`} title="Vista móvil">
                <Smartphone className="w-4 h-4" />
              </button>
              <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-lg transition-all ${device === 'desktop' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`} title="Vista escritorio">
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5" onClick={() => router.push(`/admin/templates/builder/${template.id}`)}>
              <Paintbrush2 className="w-3.5 h-3.5" /> Editar
            </Button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {loadingFull ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm font-medium">Cargando plantilla...</p>
            </div>
          ) : (
            <PreviewFrame sections={sections} theme={theme} device={device} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400 truncate max-w-xs">
            {sections.length > 0 ? sections.map(s => s.type).join(' · ') : 'Sin secciones'}
          </p>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium shrink-0 ml-4">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Template Card ─────────────────────────────────────────── */
function TemplateCard({ t, onEdit, onToggle, onDelete, onPreview, onRefresh }) {
  const router = useRouter();
  // has_content comes from the backend list query; base_json is NOT in list response
  const hasContent = !!t.has_content;
  const [capturing, setCapturing] = useState(false);
  const [localPreview, setLocalPreview] = useState(t.preview_image || null);
  const offscreenRef = useRef(null);
  const [showOffscreen, setShowOffscreen] = useState(false);
  const [captureSections, setCaptureSections] = useState([]);
  const [captureTheme, setCaptureTheme] = useState({});

  // Keep localPreview in sync when parent refreshes
  useEffect(() => { setLocalPreview(t.preview_image || null); }, [t.preview_image]);

  const handleCapture = async (e) => {
    e.stopPropagation();
    if (capturing) return;
    setCapturing(true);

    try {
      // 1. Fetch full template to get base_json (list API omits it)
      const { data: fullData } = await api.get(`/templates/${t.id}`);
      const { sections, theme } = parseTemplateJson(fullData.data?.base_json);

      if (!sections.length) {
        toast({ variant: 'destructive', title: 'Sin contenido para capturar' });
        return;
      }

      // 2. Try first-image fallback immediately (most reliable)
      const firstImg = (() => {
        for (const s of sections) {
          const p = s.props || {};
          const cands = [p.bgImage, p.image, p.imageSrc, p.heroImage, p.coupleImage1, p.coupleImage2, p.photos?.[0]?.url, p.images?.[0]?.url];
          const found = cands.find(v => typeof v === 'string' && v.startsWith('http'));
          if (found) return found;
        }
        return null;
      })();

      // 3. Mount offscreen renderer for html2canvas
      setCaptureSections(sections);
      setCaptureTheme(theme);
      setShowOffscreen(true);
      await new Promise(r => setTimeout(r, 900));

      const el = offscreenRef.current;
      let imageUrl = null;

      if (el) {
        try {
          el.style.visibility = 'visible';
          const html2canvas = (await import('html2canvas')).default;
          const captureHeight = Math.min(el.scrollHeight || 700, 700);
          const canvas = await html2canvas(el, {
            useCORS: true, allowTaint: true, scale: 2, logging: false,
            backgroundColor: theme?.background || '#ffffff',
            width: 390, height: captureHeight, scrollX: 0, scrollY: 0,
            ignoreElements: (node) => node.tagName === 'IFRAME' || node.tagName === 'VIDEO' || node.getAttribute?.('data-html2canvas-ignore') === 'true',
          });
          el.style.visibility = 'hidden';
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
          if (blob) {
            const form = new FormData();
            form.append('file', blob, `template-${t.id}-preview.webp`);
            const up = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            imageUrl = up.data?.data?.url || up.data?.url || null;
          }
        } catch { /* fall through to image fallback */ }
      }

      // 4. Fallback: use first real image from sections
      if (!imageUrl && firstImg) imageUrl = firstImg;

      if (!imageUrl) throw new Error('No se pudo generar la miniatura');

      await api.put(`/templates/${t.id}`, { preview_image: imageUrl });
      setLocalPreview(imageUrl);
      toast({ title: '✓ Vista previa generada' });
      onRefresh?.();
    } catch (err) {
      console.error('[capture]', err);
      toast({ variant: 'destructive', title: 'Error al generar vista previa', description: err.message });
    } finally {
      setShowOffscreen(false);
      setCapturing(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // EXPORT TEMPLATE - Download as .plan file
  // ══════════════════════════════════════════════════════════════
  const handleExport = async (e) => {
    e.stopPropagation();
    try {
      // Fetch full template to get base_json
      const { data: fullData } = await api.get(`/templates/${t.id}`);
      const { sections, theme } = parseTemplateJson(fullData.data?.base_json);

      if (!sections.length) {
        toast({ variant: 'destructive', title: 'Sin contenido para exportar' });
        return;
      }

      // Create .plan file
      const templateData = {
        version: '1.0',
        appName: 'Planificador de Invitaciones',
        exportDate: new Date().toISOString(),
        invitation: {
          title: t.name,
          type: t.category?.toLowerCase() || 'plantilla',
        },
        sections: sections,
        theme: theme,
      };

      const jsonString = JSON.stringify(templateData, null, 2);
      // Use 'application/octet-stream' to force download with exact extension
      const blob = new Blob([jsonString], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = t.name.replace(/[^a-z0-9áéíóúñ\s\-_]/gi, '').trim() || 'plantilla';
      const fileName = `${cleanName}.plan`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: '✓ Plantilla exportada', 
        description: `Archivo ${fileName} descargado exitosamente` 
      });
    } catch (error) {
      console.error('Error exporting template:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error al exportar', 
        description: 'No se pudo exportar la plantilla' 
      });
    }
  };

  return (
    <Card className={`group overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${!t.is_active ? 'opacity-60' : ''}`}>

      {/* Offscreen renderer — mounted inside the card so it's in the DOM */}
      {showOffscreen && (
        <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
          <OffscreenRenderer sections={captureSections} theme={captureTheme} containerRef={offscreenRef} />
        </div>
      )}

      {/* Thumbnail */}
      <div
        className="relative h-48 bg-gradient-to-br from-violet-50 to-purple-100 overflow-hidden cursor-pointer"
        onClick={() => onPreview(t)}
      >
        {localPreview ? (
          <>
            <img
              src={localPreview}
              alt={t.name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-black/50 text-white backdrop-blur-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Auto-generada
              </span>
            </div>
          </>
        ) : hasContent ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
              <Layers className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-xs text-violet-500 font-semibold">Con contenido</p>
            <p className="text-[10px] text-violet-400">Haz clic en 📷 para generar miniatura</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <FileImage className="w-10 h-10 text-violet-300" />
            <p className="text-xs text-violet-400 font-medium">Sin diseño</p>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <ZoomIn className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              Vista previa
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
            {t.is_active ? 'Activa' : 'Inactiva'}
          </span>
        </div>

        {t.category && (
          <div className="absolute bottom-2 left-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/90 ${CATEGORY_COLORS[t.category] || 'text-gray-600'}`}>
              {t.category}
            </span>
          </div>
        )}

        {hasContent && (
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-black/50 text-white backdrop-blur-sm">
              Con diseño
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <CardContent className="p-4">
        <h3 className="font-bold text-gray-900 mb-3 truncate">{t.name}</h3>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            onClick={() => router.push(`/admin/templates/builder/${t.id}`)}
          >
            <Paintbrush2 className="w-3.5 h-3.5" />
            Diseñar en Builder
          </Button>

          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="flex-1 gap-1 text-violet-600 border-violet-200 hover:bg-violet-50" onClick={() => onPreview(t)}>
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>

            {hasContent && (
              <>
                <Button
                  size="sm" variant="outline"
                  className={`px-2.5 ${capturing ? 'opacity-60' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                  onClick={handleCapture}
                  disabled={capturing}
                  title="Generar imagen de vista previa"
                >
                  {capturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </Button>

                <Button
                  size="sm" variant="outline"
                  className="px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={handleExport}
                  title="Exportar plantilla (.plan)"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </>
            )}

            <Button size="sm" variant="outline" onClick={() => onEdit(t)} className="px-2.5" title="Editar datos">
              <Pencil className="w-3.5 h-3.5" />
            </Button>

            <Button size="sm" variant="outline" onClick={() => onToggle(t)}
              className={`px-2.5 ${t.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
              title={t.is_active ? 'Desactivar' : 'Activar'}
            >
              {t.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>

            <Button size="sm" variant="ghost" className="px-2.5 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(t.id)} title="Eliminar">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get('/templates?active_only=false');
      setTemplates(data.data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar plantillas' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/templates/${editId}`, form);
        toast({ title: 'Plantilla actualizada' });
        setShowForm(false); setForm(emptyForm); setEditId(null);
        fetchTemplates();
      } else {
        const { data } = await api.post('/templates', form);
        toast({ title: 'Plantilla creada — abriendo editor...' });
        setShowForm(false); setForm(emptyForm);
        router.push(`/admin/templates/builder/${data.data.id}`);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setSaving(false); }
  };

  const handleEdit = (t) => {
    setForm({ name: t.name, category: t.category || '', is_active: t.is_active });
    setEditId(t.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (t) => {
    try {
      await api.put(`/templates/${t.id}`, { is_active: t.is_active ? 0 : 1 });
      toast({ title: `Plantilla ${t.is_active ? 'desactivada' : 'activada'}` });
      fetchTemplates();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await api.delete(`/templates/${id}`);
      toast({ title: 'Plantilla eliminada' });
      fetchTemplates();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  // ══════════════════════════════════════════════════════════════
  // GLOBAL IMPORT - Create new template from .plan file
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
        const defaultName = templateData.invitation?.title || file.name.replace('.plan', '');
        const templateName = prompt(
          `Nombre para la nueva plantilla:\n\n` +
          `Se importarán ${templateData.sections.length} secciones.`,
          defaultName
        );
        
        if (!templateName || !templateName.trim()) {
          toast({ title: 'Importación cancelada' });
          return;
        }

        // Prepare builder_json
        const builderJson = {
          sections: templateData.sections,
          theme: templateData.theme || {},
        };

        // Create new template with imported content
        const { data } = await api.post('/templates', {
          name: templateName.trim(),
          category: templateData.invitation?.type || '',
          is_active: 1,
        });

        const newTemplateId = data.data.id;

        // Update with imported content
        await api.put(`/templates/${newTemplateId}`, {
          base_json: JSON.stringify(builderJson),
        });

        toast({ 
          title: '✓ Plantilla importada', 
          description: `"${templateName}" creada con ${templateData.sections.length} secciones` 
        });

        // Refresh templates list
        fetchTemplates();
      } catch (error) {
        console.error('Error importing template:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Error al importar plantilla', 
          description: error.message || 'El archivo no es una plantilla válida' 
        });
      }
    };

    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plantillas</h1>
          <p className="text-gray-500 mt-1">Gestiona las plantillas base disponibles para los clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleGlobalImport}
            className="gap-2"
          >
            <Upload className="w-4 h-4" /> Importar Plantilla
          </Button>
          <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Plantilla
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? 'Editar Plantilla' : 'Nueva Plantilla'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Boda Elegante" />
              </div>
              <div className="md:col-span-2">
                <Label>Categoría</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear y abrir builder'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
              </div>
              {!editId && (
                <p className="md:col-span-2 text-xs text-gray-400 flex items-center gap-1.5">
                  <span className="text-violet-500">✦</span>
                  Usa el botón 📷 en la card para generar la imagen de vista previa después de diseñar.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="h-48 animate-pulse bg-gray-100 rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay plantillas creadas aún</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />Crear plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <TemplateCard key={t.id} t={t}
              onEdit={handleEdit} onToggle={handleToggle}
              onDelete={handleDelete} onPreview={setPreviewTemplate}
              onRefresh={fetchTemplates}
            />
          ))}
        </div>
      )}

      {previewTemplate && (
        <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
    </div>
  );
}
