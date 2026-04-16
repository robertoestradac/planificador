'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, Globe, EyeOff,
  Monitor, Smartphone, Undo2, Redo2, ExternalLink,
  Layers, Pencil, Palette, Music2, Type, Image,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import useFontLoader from './hooks/useFontLoader';
import useAutoSave from './hooks/useAutoSave';
import useBuilderSections from './hooks/useBuilderSections';

/* ── Lazy-load heavy components to reduce initial bundle ──────── */
const Canvas = dynamic(() => import('./components/Canvas'), { ssr: false, loading: () => null });
const FreeCanvas = dynamic(() => import('./components/FreeCanvas'), { ssr: false, loading: () => null });
const AddBlockModal = dynamic(() => import('./components/AddBlockModal'), { ssr: false, loading: () => null });
const PropertiesDrawer = dynamic(() => import('./components/PropertiesDrawer'), { ssr: false, loading: () => null });
const GlobalThemeDrawer = dynamic(() => import('./components/GlobalThemeDrawer'), { ssr: false, loading: () => null });

/* ── Historial undo/redo ─────────────────────────────────────── */
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

/* ── Bottom Toolbar Button ───────────────────────────────────── */
function ToolbarBtn({ icon: Icon, label, onClick, active, pink }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-xs font-semibold
        transition-all duration-150 flex-shrink-0
        ${active
          ? 'bg-pink-50 text-pink-600'
          : pink
            ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-200 px-5'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

/* ── Default global theme ────────────────────────────────────── */
const DEFAULT_THEME = {
  primary:    '#FF4D8F',
  secondary:  '#7c3aed',
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

/* ── Estimated heights per section type (generous for Phase-1 layout) ─── */
const BLOCK_HEIGHTS = {
  hero: 350, divider: 50, text: 150, quote: 130,
  gallery: 450, gifts: 320, schedule: 650, countdown: 200,
  map: 300, rsvp: 280, music_player: 100, couple: 280,
  video: 300, hospedaje: 250, dress_code: 200, confirm: 250,
};

/**
 * Assigns x/y/zIndex to every section vertically.
 * force=true ignores existing positions (re-layout all).
 */
function autoLayoutSections(sections, force = false) {
  let nextY = 0;
  return sections.map((section, i) => {
    const hasPos =
      !force &&
      section.props?.x !== undefined &&
      section.props?.y !== undefined &&
      !(section.props.x === 0 && section.props.y === 0 && i > 0); // skip if all piled at 0,0
    const estimated = BLOCK_HEIGHTS[section.type] ?? 160;
    if (hasPos) {
      nextY = Math.max(nextY, (section.props.y ?? 0) + estimated + 12);
      return { ...section, props: { ...section.props, layerHidden: false } };
    }
    const newSection = {
      ...section,
      props: {
        ...section.props,
        x: 0,
        y: nextY,
        zIndex: i + 1,
        layerW: 390,
        layerHidden: false, // always show on layout
      },
    };
    nextY += estimated + 12;
    return newSection;
  });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN BUILDER PAGE
═══════════════════════════════════════════════════════════════ */
export default function BuilderPage() {
  const { id }   = useParams();
  const router   = useRouter();

  // State
  const [invitation,      setInvitation]      = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [publishing,      setPublishing]      = useState(false);
  const [isPublished,     setIsPublished]     = useState(false);
  const [viewMode,        setViewMode]        = useState('mobile');
  const [globalTheme,     setGlobalTheme]     = useState(DEFAULT_THEME);
  const [selectedId,      setSelectedId]      = useState(null);
  const [activeId,        setActiveId]        = useState(null);

  // Active panel/drawer: null | 'add-block' | 'theme' | 'details' | 'properties'
  const [activePanel,    setActivePanel]    = useState(null);
  const [activeThemeTab, setActiveThemeTab] = useState('background');
  const [canvasMode, setCanvasMode] = useState('stack'); // 'stack' | 'free'
  const [showLayers, setShowLayers] = useState(false);
  // Ref to prevent Phase-2 real-height layout from running more than once per mode switch
  const freeLayoutDone = useRef(false);
  // Real section heights reported by FreeCanvas ResizeObserver
  const measuredHeightsRef = useRef({});

  const { sections, setSections, undo, redo, canUndo, canRedo } = useHistory([]);
  // Always-fresh ref to sections (fixes stale-closure bugs in async callbacks)
  const sectionsRef = useRef(sections);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  const themeRef = useRef(globalTheme);
  useEffect(() => { themeRef.current = globalTheme; }, [globalTheme]);

  const canvasModeRef = useRef(canvasMode);
  useEffect(() => { canvasModeRef.current = canvasMode; }, [canvasMode]);

  // ── Auto-save hook ──
  const {
    isDirty, setIsDirty, lastSaved, saving, handleSave, autoSave,
    scheduleAutoSave, autoSaveTimer, cleanup: cleanupAutoSave,
  } = useAutoSave(id, sectionsRef, themeRef, canvasModeRef);

  // ── Load invitation ──────────────────────────────────────────
  useEffect(() => {
    api.get(`/invitations/${id}`)
      .then(({ data }) => {
        const inv = data.data;
        setInvitation(inv);
        setIsPublished(inv.status === 'published');
        if (inv.builder_json) {
          try {
            const parsed = JSON.parse(inv.builder_json);
            const secs = parsed.sections || [];
            setSections(secs);
            
            // If the loaded invitation already has manually positioned X, Y properties,
            // DO NOT run Phase-2 auto layout! This will destroy the user's overlaps!
            const unpositioned = secs.filter(s => s.type !== 'hero' || s.props?.y === 0).every(s => !s.props?.y);
            if (!unpositioned && secs.length > 0) {
              freeLayoutDone.current = true;
            }

            if (parsed.theme) {
              setGlobalTheme({ ...DEFAULT_THEME, ...parsed.theme });
              if (parsed.theme.canvasMode) setCanvasMode(parsed.theme.canvasMode);
            }
          } catch { setSections([]); }
        }
      })
      .catch(() => toast({ variant: 'destructive', title: 'Error al cargar la invitación' }))
      .finally(() => setLoading(false));

    const handleBeforeUnload = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupAutoSave();
    };
  }, [id]);

  // ── Font loading (catalog preview + per-section full weights) ──
  useFontLoader(sections, globalTheme?.fontFamily);

  // ── Update sections (marks dirty + auto-save) ─────────────────
  const updateSections = useCallback((ns) => {
    setSections(ns);
    scheduleAutoSave();
  }, [setSections, scheduleAutoSave]);

  const updateTheme = useCallback((nt) => {
    setGlobalTheme(nt);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // ── Publish toggle ───────────────────────────────────────────
  const handleTogglePublish = async () => {
    if (isDirty) await handleSave();
    setPublishing(true);
    try {
      const action = isPublished ? 'unpublish' : 'publish';
      await api.patch(`/invitations/${id}/${action}`);
      setIsPublished(!isPublished);
      toast({ title: isPublished ? 'Invitación despublicada' : 'Invitación publicada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally { setPublishing(false); }
  };

  // ── DnD sensors ─────────────────────────────────────────────
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

  // ── Section CRUD (extracted hook) ─────────────────────────────
  const {
    handleAddBlock, handleDelete, handleDuplicate,
    handleMoveUp, handleMoveDown, handleUpdateProps, handleBatchUpdateProps,
  } = useBuilderSections(sectionsRef, updateSections, selectedId, setSelectedId, measuredHeightsRef);

  const handleOpenSettings = (sid) => {
    setSelectedId(sid);
    setActivePanel('properties');
  };

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); }
      if (ctrl && e.key === 'z') { e.preventDefault(); undo(); setIsDirty(true); }
      if (ctrl && e.key === 'y') { e.preventDefault(); redo(); setIsDirty(true); }
      if (e.key === 'Escape')    { setActivePanel(null); setSelectedId(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !activePanel) {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          handleDelete(selectedId);
        }
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [undo, redo, isDirty, selectedId, activePanel, handleDelete, handleSave]);

  // ── Stable free-canvas callbacks (use sectionsRef, never stale) ──────
  const handleRelayout = useCallback((measuredHeights = {}) => {
    let y = 0;
    const GAP = 0;
    const laid = sectionsRef.current.map((s, i) => {
      const h = measuredHeights[s.id] || BLOCK_HEIGHTS[s.type] || 160;
      const section = {
        ...s,
        props: { ...s.props, x: 0, y, zIndex: i + 1, layerW: 390, layerHidden: false },
      };
      y += h + GAP;
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

  const handleCompact = useCallback((heights) => {
    // Sweep-line algorithm to remove perfectly empty vertical spaces (white gaps) without destroying overlaps.
    const current = sectionsRef.current;
    if (current.length === 0) return;

    const rects = current.map(s => {
      const top = s.props?.y ?? 0;
      const h = heights[s.id] ?? BLOCK_HEIGHTS[s.type] ?? 160;
      return { id: s.id, top, bottom: top + h, h, s };
    }).sort((a, b) => a.top - b.top);

    const covered = [];
    rects.forEach(r => {
      if (covered.length === 0) {
        covered.push({ top: r.top, bottom: r.bottom });
      } else {
        const last = covered[covered.length - 1];
        if (r.top <= last.bottom + 16) {
          last.bottom = Math.max(last.bottom, r.bottom);
        } else {
          covered.push({ top: r.top, bottom: r.bottom });
        }
      }
    });

    const getShiftedY = (y) => {
      let totalEmpty = 0;
      for (let i = 0; i < covered.length - 1; i++) {
        const gapTop = covered[i].bottom;
        const gapBottom = covered[i + 1].top;
        if (y >= gapBottom) {
          totalEmpty += (gapBottom - gapTop - 16);
        }
      }
      const firstTop = covered[0]?.top || 0;
      if (y >= firstTop) {
        totalEmpty += Math.max(0, firstTop - 16);
      }
      return Math.max(0, y - totalEmpty);
    };

    const updated = current.map(s => {
      const top = s.props?.y ?? 0;
      const newY = getShiftedY(top);
      return { ...s, props: { ...s.props, y: Math.round(newY) } };
    }).sort((a, b) => (a.props?.y ?? 0) - (b.props?.y ?? 0));

    // Instant save after compact
    updateSections(updated);
  }, [updateSections]);

  const selectedSection = sections.find(s => s.id === selectedId);
  const savedLabel      = lastSaved ? lastSaved.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : null;

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-pink-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-400">Cargando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="fixed inset-0 z-[100] flex flex-col bg-white h-screen w-screen overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 flex-shrink-0 z-50">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (isDirty && !confirm('Cambios sin guardar. ¿Salir?')) return;
                router.push('/dashboard/invitations');
              }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Volver</span>
            </button>

            <div className="h-5 w-px bg-gray-200" />

            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{invitation?.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isPublished ? '● Publicada' : '○ Borrador'}
                </span>
                {isDirty && <span className="text-[10px] text-amber-500 font-semibold">● Sin guardar</span>}
                {!isDirty && savedLabel && <span className="text-[10px] text-gray-400">✓ {savedLabel}</span>}
              </div>
            </div>
          </div>

          {/* Center: view toggles + undo/redo */}
          <div className="flex items-center gap-1">
            <button onClick={() => { undo(); setIsDirty(true); }} disabled={!canUndo} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors tooltip" data-tip="Deshacer">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={() => { redo(); setIsDirty(true); }} disabled={!canRedo} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors tooltip" data-tip="Rehacer">
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            {/* Device toggles */}
            {[
              { mode: 'mobile',  icon: <Smartphone className="w-4 h-4" />, tip: 'Móvil' },
              { mode: 'desktop', icon: <Monitor className="w-4 h-4" />,    tip: 'Escritorio' },
            ].map(({ mode, icon, tip }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-xl transition-colors tooltip ${viewMode === mode ? 'bg-pink-50 text-pink-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                data-tip={tip}
              >
                {icon}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            {/* Canvas mode toggle */}
            <button
              onClick={() => {
                if (canvasMode === 'stack') {
                  const unpositioned = sections.filter(s => s.type !== 'hero' || s.props?.y === 0).every(s => !s.props?.y);
                  
                  if (unpositioned && sections.length > 0) {
                    freeLayoutDone.current = false; // allow Phase-2 to run
                    const laid = autoLayoutSections(sections, true);
                    updateSections(laid);
                  } else {
                    freeLayoutDone.current = true;
                  }
                  setCanvasMode('free');
                  setShowLayers(true);
                  scheduleAutoSave(2000);
                } else {
                  // Simply toggle Layers view if already deep in free mode!
                  setShowLayers(!showLayers);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                canvasMode === 'free' && showLayers
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Mostrar/Ocultar y Activar Capas"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Capas</span>
            </button>
          </div>

          {/* Right: save + publish */}
          <div className="flex items-center gap-2">
            {isPublished && invitation?.slug && (
              <a href={`/i/${invitation.slug}`} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors tooltip" data-tip="Ver publicada">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => handleSave()}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Guardar</span>
            </button>

            <button
              onClick={handleTogglePublish}
              disabled={publishing || saving || sections.length === 0}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all disabled:opacity-40 ${
                isPublished
                  ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  : 'text-white bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 shadow-md shadow-pink-200'
              }`}
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" />
                : isPublished ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPublished ? 'Despublicar' : 'Compartir'}</span>
            </button>
          </div>
        </div>

        {/* ── CANVAS AREA ── */}
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
            onCompact={handleCompact}
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

        {/* ══════════════════════════════════════
            BOTTOM TOOLBAR  (estilo Invitio)
        ══════════════════════════════════════ */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] builder-toolbar rounded-3xl px-3 py-2 flex items-center gap-1">
          <ToolbarBtn
            icon={Pencil} label="Detalles"
            onClick={() => setActivePanel(p => p === 'details' ? null : 'details')}
            active={activePanel === 'details'}
          />
          <ToolbarBtn
            icon={Image} label="Fondo"
            onClick={() => { setActiveThemeTab('background'); setActivePanel(p => p === 'theme' ? null : 'theme'); }}
            active={activePanel === 'theme' && activeThemeTab === 'background'}
          />
          <ToolbarBtn
            icon={Palette} label="Colores"
            onClick={() => { setActiveThemeTab('colors'); setActivePanel(p => p === 'theme' ? null : 'theme'); }}
            active={activePanel === 'theme' && activeThemeTab === 'colors'}
          />
          <ToolbarBtn
            icon={Music2} label="Música"
            onClick={() => {
              const hasMp = sections.find(s => s.type === 'music_player');
              if (hasMp) { setSelectedId(hasMp.id); setActivePanel('properties'); }
              else { handleAddBlock('music_player'); }
            }}
            active={false}
          />
          <ToolbarBtn
            icon={Type} label="Fuentes"
            onClick={() => { setActiveThemeTab('fonts'); setActivePanel(p => p === 'theme' ? null : 'theme'); }}
            active={activePanel === 'theme' && activeThemeTab === 'fonts'}
          />

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 mx-1" />

          {/* Primary pink CTA */}
          <button
            onClick={() => setActivePanel(p => p === 'add-block' ? null : 'add-block')}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all
              ${activePanel === 'add-block'
                ? 'bg-gray-200 text-gray-700'
                : 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-200 hover:shadow-xl hover:from-pink-600'
              }
            `}
          >
            <span className="text-lg leading-none">+</span>
            Añadir bloque
          </button>
        </div>

        {/* DragOverlay */}
        <DragOverlay dropAnimation={null}>
          {activeId && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-2xl shadow-2xl text-sm font-bold">
              Moviendo bloque...
            </div>
          )}
        </DragOverlay>
      </div>

      {/* ══════════════════════════════════════
          OVERLAYS / DRAWERS / MODALS
      ══════════════════════════════════════ */}

      {/* Add Block Modal */}
      {activePanel === 'add-block' && (
        <AddBlockModal
          onClose={() => setActivePanel(null)}
          onAddBlock={handleAddBlock}
        />
      )}

      {/* Properties Drawer */}
      {activePanel === 'properties' && selectedSection && (
        <PropertiesDrawer
          section={selectedSection}
          onUpdateProps={handleUpdateProps}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Global Theme Drawer */}
      {activePanel === 'theme' && (
        <GlobalThemeDrawer
          theme={globalTheme}
          onUpdateTheme={updateTheme}
          onClose={() => setActivePanel(null)}
          defaultTab={activeThemeTab}
        />
      )}

      {/* Details panel (simple) */}
      {activePanel === 'details' && (
        <div className="fixed inset-0 z-[150]" onClick={() => setActivePanel(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl drawer-enter p-5 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-4">Detalles de la invitación</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Título</p>
                <p className="font-semibold text-gray-900">{invitation?.title}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Estado</p>
                <p className="font-semibold text-gray-900">{isPublished ? 'Publicada' : 'Borrador'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Secciones</p>
                <p className="font-semibold text-gray-900">{sections.length} bloque{sections.length !== 1 ? 's' : ''}</p>
              </div>
              {invitation?.slug && (
                <a
                  href={`/i/${invitation.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-2xl font-semibold text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver invitación publicada
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
