'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, Monitor, Smartphone,
  Undo2, Redo2, Layers, Palette, Type, LayoutTemplate, Image, Eye, X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import useFontLoader        from '@/app/dashboard/builder/[id]/hooks/useFontLoader';
import useBuilderSections   from '@/app/dashboard/builder/[id]/hooks/useBuilderSections';
import { getSectionComponent } from '@/app/dashboard/builder/[id]/section-types';
import { getSectionBgStyle, getBodyBgStyle } from '@/app/dashboard/builder/[id]/utils/bgStyles';
import useTemplateScreenshot from './hooks/useTemplateScreenshot';

/* ── Lazy-load heavy builder components (reduces initial bundle) ── */
const Canvas = dynamic(
  () => import('@/app/dashboard/builder/[id]/components/Canvas'),
  { ssr: false, loading: () => null }
);
const FreeCanvas = dynamic(
  () => import('@/app/dashboard/builder/[id]/components/FreeCanvas'),
  { ssr: false, loading: () => null }
);
const AddBlockModal = dynamic(
  () => import('@/app/dashboard/builder/[id]/components/AddBlockModal'),
  { ssr: false, loading: () => null }
);
const PropertiesDrawer = dynamic(
  () => import('@/app/dashboard/builder/[id]/components/PropertiesDrawer'),
  { ssr: false, loading: () => null }
);
const GlobalThemeDrawer = dynamic(
  () => import('@/app/dashboard/builder/[id]/components/GlobalThemeDrawer'),
  { ssr: false, loading: () => null }
);

/* ── Undo/redo ──────────────────────────────────────────────── */
const MAX_HISTORY = 30;

function useHistory(initial) {
  const [past,    setPast]    = useState([]);
  const [present, setPresent] = useState(initial);
  const [future,  setFuture]  = useState([]);

  const set = useCallback((np) => {
    setPast(p => [...p.slice(-MAX_HISTORY + 1), present]);
    setPresent(np);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture(f => [present, ...f]);
    setPresent(past[past.length - 1]);
    setPast(p => p.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast(p => [...p, present]);
    setPresent(future[0]);
    setFuture(f => f.slice(1));
  }, [future, present]);

  return { sections: present, setSections: set, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}

/* ── Block heights (same as tenant builder) ─────────────────── */
const BLOCK_HEIGHTS = {
  hero: 350, divider: 50, text: 150, quote: 130,
  gallery: 450, gifts: 320, schedule: 650, countdown: 200,
  map: 300, rsvp: 280, music_player: 100, couple: 280,
  video: 300, hospedaje: 250, dress_code: 200,
};

function autoLayoutSections(sections) {
  let nextY = 0;
  return sections.map((section, i) => {
    const estimated = BLOCK_HEIGHTS[section.type] ?? 160;
    const newSection = {
      ...section,
      props: { ...section.props, x: 0, y: nextY, zIndex: i + 1, layerW: 390, layerHidden: false },
    };
    nextY += estimated + 12;
    return newSection;
  });
}

const DEFAULT_THEME = {
  primary:    '#7c3aed',
  secondary:  '#a855f7',
  background: '#ffffff',
  text:       '#1a1a2e',
  fontFamily: 'Playfair Display',
  animation:  'fade-up',
  bodyBgType: 'none',
  bodyBgColor: '',
  bodyBgGradient: '',
  bodyBgImage: '',
  openingAnimation: 'none',
};

/* ══════════════════════════════════════════════════════════════
   ADMIN TEMPLATE BUILDER
══════════════════════════════════════════════════════════════ */
export default function AdminTemplateBuilderPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [template,    setTemplate]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [isDirty,     setIsDirty]     = useState(false);
  const [lastSaved,   setLastSaved]   = useState(null);
  const [viewMode,    setViewMode]    = useState('mobile');
  const [globalTheme, setGlobalTheme] = useState(DEFAULT_THEME);
  const [selectedId,  setSelectedId]  = useState(null);
  const [activeId,    setActiveId]    = useState(null);
  const [activePanel,    setActivePanel]    = useState(null);
  const [activeThemeTab, setActiveThemeTab] = useState('background');
  const [previewMode,    setPreviewMode]    = useState(false);
  const [canvasMode,     setCanvasMode]     = useState('stack');
  const [showLayers,  setShowLayers]  = useState(false);
  const freeLayoutDone = useRef(false);
  const autoSaveTimer  = useRef(null);
  // Real section heights reported by FreeCanvas ResizeObserver
  const measuredHeightsRef = useRef({});

  const { sections, setSections, undo, redo, canUndo, canRedo } = useHistory([]);
  const sectionsRef   = useRef(sections);
  const themeRef      = useRef(globalTheme);
  const canvasModeRef = useRef(canvasMode);

  const { captureAndSave, CapturePortal } = useTemplateScreenshot(id, sectionsRef, themeRef);
  useEffect(() => { sectionsRef.current  = sections;   }, [sections]);
  useEffect(() => { themeRef.current     = globalTheme; }, [globalTheme]);
  useEffect(() => { canvasModeRef.current = canvasMode; }, [canvasMode]);

  /* ── Load template ─────────────────────────────────────────── */
  useEffect(() => {
    api.get(`/templates/${id}`)
      .then(({ data }) => {
        const tmpl = data.data;
        setTemplate(tmpl);
        if (tmpl.base_json) {
          try {
            const parsed = JSON.parse(tmpl.base_json);
            const secs = parsed.sections || [];
            setSections(secs);
            if (parsed.theme) {
              setGlobalTheme({ ...DEFAULT_THEME, ...parsed.theme });
              if (parsed.theme.canvasMode) setCanvasMode(parsed.theme.canvasMode);
            }
            const hasPositions = secs.some(s => s.props?.y !== undefined && s.props.y > 0);
            if (hasPositions) freeLayoutDone.current = true;
          } catch { setSections([]); }
        }
      })
      .catch(() => toast({ variant: 'destructive', title: 'Error al cargar la plantilla' }))
      .finally(() => setLoading(false));

    return () => clearTimeout(autoSaveTimer.current);
  }, [id]);

  useFontLoader(sections, globalTheme?.fontFamily);

  /* ── Auto-thumbnail helper ─────────────────────────────────── */
  const getFirstSectionImage = useCallback((sections) => {
    for (const s of sections) {
      const p = s.props || {};
      const candidates = [
        p.bgImage, p.image, p.imageSrc, p.heroImage,
        p.coupleImage1, p.coupleImage2,
        p.photos?.[0]?.url, p.images?.[0]?.url, p.images?.[0],
      ];
      const found = candidates.find(v => typeof v === 'string' && v.startsWith('http'));
      if (found) return found;
    }
    return null;
  }, []);

  /* ── Save to template ──────────────────────────────────────── */
  const doSave = useCallback(async (silent = false) => {
    const base_json = JSON.stringify({
      sections: sectionsRef.current,
      theme: { ...themeRef.current, canvasMode: canvasModeRef.current },
    });
    await api.patch(`/templates/${id}/builder`, { base_json });
    setIsDirty(false);
    setLastSaved(new Date());
    if (!silent) toast({ title: '✓ Plantilla guardada' });
  }, [id]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await doSave(false);
      // Auto-thumbnail: try html2canvas first, fallback to first real image found in sections
      if (sectionsRef.current?.length > 0) {
        captureAndSave().then(url => {
          if (!url) {
            const fallback = getFirstSectionImage(sectionsRef.current);
            if (fallback) {
              api.put(`/templates/${id}`, { preview_image: fallback }).catch(() => {});
            }
          }
        }).catch(() => {
          const fallback = getFirstSectionImage(sectionsRef.current);
          if (fallback) {
            api.put(`/templates/${id}`, { preview_image: fallback }).catch(() => {});
          }
        });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: err.response?.data?.message });
    } finally { setSaving(false); }
  }, [saving, doSave, captureAndSave, sectionsRef, getFirstSectionImage, id]);

  const scheduleAutoSave = useCallback((delay = 6000) => {
    setIsDirty(true);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doSave(true).catch(() => {}), delay);
  }, [doSave]);

  /* ── Section updates ───────────────────────────────────────── */
  const updateSections = useCallback((ns) => {
    setSections(ns);
    scheduleAutoSave();
  }, [setSections, scheduleAutoSave]);

  const updateTheme = useCallback((nt) => {
    setGlobalTheme(nt);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  /* ── DnD ───────────────────────────────────────────────────── */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (e) => setActiveId(e.active.id);
  const handleDragEnd   = (e) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    if (active.id !== over.id && over.id !== 'canvas-droppable') {
      const oldIdx = sections.findIndex(s => s.id === active.id);
      const newIdx = sections.findIndex(s => s.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        updateSections(arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, order: i + 1 })));
      }
    }
  };

  /* ── Section CRUD ──────────────────────────────────────────── */
  const {
    handleAddBlock, handleDelete, handleDuplicate,
    handleMoveUp, handleMoveDown, handleUpdateProps, handleBatchUpdateProps,
  } = useBuilderSections(sectionsRef, updateSections, selectedId, setSelectedId, measuredHeightsRef);

  const handleOpenSettings = (sid) => {
    setSelectedId(sid);
    setActivePanel('properties');
  };

  /* ── Keyboard shortcuts ────────────────────────────────────── */
  useEffect(() => {
    const down = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); }
      if (ctrl && e.key === 'z') { e.preventDefault(); undo(); setIsDirty(true); }
      if (ctrl && e.key === 'y') { e.preventDefault(); redo(); setIsDirty(true); }
      if (e.key === 'Escape')    { setActivePanel(null); setSelectedId(null); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [undo, redo, handleSave]);

  /* ── Free canvas helpers ───────────────────────────────────── */
  const handleRelayout = useCallback((measuredHeights = {}) => {
    let y = 0;
    const laid = sectionsRef.current.map((s, i) => {
      const h = measuredHeights[s.id] || BLOCK_HEIGHTS[s.type] || 160;
      const section = { ...s, props: { ...s.props, x: 0, y, zIndex: i + 1, layerW: 390, layerHidden: false } };
      y += h;
      return section;
    });
    updateSections(laid);
  }, [updateSections]);

  const handleShowAll = useCallback(() => {
    updateSections(sectionsRef.current.map(s => ({ ...s, props: { ...s.props, layerHidden: false } })));
  }, [updateSections]);

  const handleRelayoutWithHeights = useCallback((heights) => {
    if (freeLayoutDone.current) return;
    freeLayoutDone.current = true;
    let y = 0;
    const laid = sectionsRef.current.map((s, i) => {
      const h = heights[s.id] || BLOCK_HEIGHTS[s.type] || 200;
      const section = { ...s, props: { ...s.props, x: 0, y, zIndex: i + 1, layerW: 390, layerHidden: false } };
      y += h + 8;
      return section;
    });
    updateSections(laid);
  }, [updateSections]);

  const selectedSection = sections.find(s => s.id === selectedId);
  const savedLabel = lastSaved ? lastSaved.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : null;

  /* ── Loading ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-400">Cargando editor de plantilla...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="fixed inset-0 z-[100] flex flex-col bg-white h-screen w-screen overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-4 h-14 bg-gray-900 border-b border-gray-800 flex-shrink-0 z-50">

          {/* Left: Back + template name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (isDirty && !confirm('Cambios sin guardar. ¿Salir?')) return;
                router.push('/admin/templates');
              }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-2 py-1.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Plantillas</span>
            </button>

            <div className="h-5 w-px bg-gray-700" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate max-w-[200px]">{template?.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-violet-900 text-violet-300">
                    Plantilla Admin
                  </span>
                  {isDirty && <span className="text-[10px] text-amber-400 font-semibold">● Sin guardar</span>}
                  {!isDirty && savedLabel && <span className="text-[10px] text-gray-500">✓ {savedLabel}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Center: undo/redo + device + canvas mode */}
          <div className="flex items-center gap-1">
            <button onClick={() => { undo(); setIsDirty(true); }} disabled={!canUndo}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={() => { redo(); setIsDirty(true); }} disabled={!canRedo}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-700 mx-1" />
            {[
              { mode: 'mobile',  icon: <Smartphone className="w-4 h-4" /> },
              { mode: 'desktop', icon: <Monitor    className="w-4 h-4" /> },
            ].map(({ mode, icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`p-2 rounded-xl transition-colors ${viewMode === mode ? 'bg-violet-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                {icon}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-700 mx-1" />
            <button
              onClick={() => {
                if (canvasMode === 'stack') {
                  freeLayoutDone.current = false;
                  updateSections(autoLayoutSections(sections));
                  setCanvasMode('free');
                  setShowLayers(true);
                  scheduleAutoSave(2000);
                } else {
                  setShowLayers(!showLayers);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                canvasMode === 'free' && showLayers ? 'bg-violet-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Capas</span>
            </button>
          </div>

          {/* Right: save */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePanel(p => p === 'theme' ? null : 'theme')}
              className={`p-2 rounded-xl transition-colors ${activePanel === 'theme' ? 'bg-violet-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              title="Tema y colores"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              title="Vista previa"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Vista previa</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl disabled:opacity-40 transition-colors"
              title="Guardar y generar vista previa automáticamente"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Guardar plantilla</span>
            </button>
          </div>
        </div>

        {/* ── Admin badge strip ── */}
        <div className="h-6 bg-violet-700 flex items-center justify-center flex-shrink-0">
          <p className="text-[11px] text-violet-200 font-semibold tracking-wide">
            ✦ PLANTILLA BASE — Los tenants reciben una copia independiente al seleccionarla. Sus cambios no afectan esta plantilla ni viceversa ✦
          </p>
        </div>

        {/* ── CANVAS ── */}
        {canvasMode === 'free' ? (
          <FreeCanvas
            sections={sections}
            selectedSectionId={selectedId}
            onSelectSection={setSelectedId}
            onDeleteSection={handleDelete}
            onDuplicateSection={handleDuplicate}
            onOpenSettings={handleOpenSettings}
            onUpdateProps={handleUpdateProps}
            onBatchUpdateProps={handleBatchUpdateProps}
            showLayers={showLayers}
            onRelayout={handleRelayout}
            onShowAll={handleShowAll}
            onRelayoutWithHeights={handleRelayoutWithHeights}
            onCompact={() => {}}
            onHeightsChange={(h) => { measuredHeightsRef.current = h; }}
            viewMode={viewMode}
            globalTheme={globalTheme}
          />
        ) : (
          <Canvas
            sections={sections}
            selectedSectionId={selectedId}
            onSelectSection={setSelectedId}
            onDeleteSection={handleDelete}
            onDuplicateSection={handleDuplicate}
            onOpenSettings={handleOpenSettings}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            viewMode={viewMode}
            globalTheme={globalTheme}
          />
        )}

        {/* ── Bottom Toolbar ── */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] builder-toolbar rounded-3xl px-3 py-2 flex items-center gap-1">
          <button
            onClick={() => { setActiveThemeTab('background'); setActivePanel(p => p === 'theme' ? null : 'theme'); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${activePanel === 'theme' && activeThemeTab === 'background' ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
          >
            <Image className="w-4 h-4" />
            <span>Fondo</span>
          </button>
          <button
            onClick={() => { setActiveThemeTab('colors'); setActivePanel(p => p === 'theme' ? null : 'theme'); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${activePanel === 'theme' && activeThemeTab === 'colors' ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
          >
            <Palette className="w-4 h-4" />
            <span>Colores</span>
          </button>
          <button
            onClick={() => { setActiveThemeTab('fonts'); setActivePanel(p => p === 'theme' ? null : 'theme'); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${activePanel === 'theme' && activeThemeTab === 'fonts' ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
          >
            <Type className="w-4 h-4" />
            <span>Fuentes</span>
          </button>

          <div className="w-px h-8 bg-gray-200 mx-1" />

          <button
            onClick={() => setActivePanel(p => p === 'add-block' ? null : 'add-block')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              activePanel === 'add-block'
                ? 'bg-gray-200 text-gray-700'
                : 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:from-violet-700'
            }`}
          >
            <span className="text-lg leading-none">+</span>
            Añadir bloque
          </button>
        </div>

        {/* DragOverlay */}
        <DragOverlay dropAnimation={null}>
          {activeId && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl shadow-2xl text-sm font-bold">
              Moviendo bloque...
            </div>
          )}
        </DragOverlay>
      </div>

      {/* ── OVERLAYS ── */}
      {activePanel === 'add-block' && (
        <AddBlockModal onClose={() => setActivePanel(null)} onAddBlock={handleAddBlock} />
      )}

      {activePanel === 'properties' && selectedSection && (
        <PropertiesDrawer
          section={selectedSection}
          onUpdateProps={handleUpdateProps}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'theme' && (
        <GlobalThemeDrawer
          theme={globalTheme}
          onUpdateTheme={updateTheme}
          onClose={() => setActivePanel(null)}
          defaultTab={activeThemeTab}
        />
      )}

      {/* ── PREVIEW MODE — identical to public /i/[slug] page ── */}
      {previewMode && (
        <div className="fixed inset-0 z-[300] flex flex-col bg-gray-950">
          {/* Bar */}
          <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 bg-gray-900 border-b border-gray-800">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-400" />
              Vista previa — {template?.name}
            </span>
            <button onClick={() => setPreviewMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-4 h-4" />
              Cerrar
            </button>
          </div>

          {/* Full scrollable view — same as /i/[slug] */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              ...getBodyBgStyle(globalTheme),
              fontFamily: globalTheme?.fontFamily ? `"${globalTheme.fontFamily}", serif` : undefined,
              '--theme-primary':    globalTheme?.primary    || '#FF4D8F',
              '--theme-secondary':  globalTheme?.secondary  || '#7c3aed',
              '--theme-background': globalTheme?.background || '#ffffff',
              '--theme-text':       globalTheme?.text       || '#1a1a2e',
            }}
          >
            <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100%' }}>
              {sections.length === 0 && (
                <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
                  Sin bloques
                </div>
              )}
              {canvasMode === 'free' ? (
                <div style={{ position: 'relative', width: 390, height: `${sections.reduce((max, s) => Math.max(max, (s.props?.y ?? 0) + (s.props?.layerH ?? 200)), 0)}px` }}>
                  {[...sections]
                    .sort((a, b) => (a.props?.zIndex ?? 1) - (b.props?.zIndex ?? 1))
                    .map(section => {
                      const SectionComponent = getSectionComponent(section.type);
                      if (!SectionComponent) return null;
                      const bgStyle = getSectionBgStyle(section.props);
                      return (
                        <div
                          key={section.id}
                          style={{
                            position: 'absolute',
                            left: section.props?.x ?? 0,
                            top: section.props?.y ?? 0,
                            width: section.props?.layerW === 'auto' ? 'auto' : (section.props?.layerW ?? 390),
                            zIndex: section.props?.zIndex ?? 1,
                            display: section.props?.layerHidden ? 'none' : 'block',
                          }}
                        >
                          {bgStyle && <div style={bgStyle} />}
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <SectionComponent props={section.props} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                sections.map(section => {
                  const SectionComponent = getSectionComponent(section.type);
                  if (!SectionComponent) return null;
                  const bgStyle = getSectionBgStyle(section.props);
                  return (
                    <div key={section.id} style={{ position: 'relative' }}>
                      {bgStyle && <div style={bgStyle} />}
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <SectionComponent props={section.props} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </DndContext>
      <CapturePortal />
    </>
  );
}
