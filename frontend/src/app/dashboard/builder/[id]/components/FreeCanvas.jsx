'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { getSectionComponent } from '../section-types';
import { getSectionBgStyle, getBodyBgStyle } from '../utils/bgStyles';
import {
  Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown,
  Trash2, Settings, Copy, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';

/*─────────────────────────────────────────────────────────────────
  FREE CANVAS  –  Canva-style free-positioning layer system
  
  Architecture:
  • The "page" (invitation) is ONE fixed-size absolute container.
  • Every section is absolutely positioned inside it (x, y, w, h).
  • The outer viewport is scrollable + zoomable (CSS transform scale).
  • Drag is calculated in canvas-space (accounting for zoom).
  • Right panel = layers list (Photoshop style, dark theme).
─────────────────────────────────────────────────────────────────*/

const CANVAS_W   = 390;    // mobile width – phone format
const MIN_HEIGHT = 600;    // minimum canvas height

export default function FreeCanvas({
  sections, selectedSectionId, onSelectSection,
  onDeleteSection, onDuplicateSection, onOpenSettings,
  onUpdateProps, onBatchUpdateProps, onRelayout, onShowAll, onRelayoutWithHeights, onCompact,
  onHeightsChange,
  globalTheme, showLayers = true,
}) {
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef(null);
  const [sectionHeights, setSectionHeights] = useState({});
  const hasAutoLayouted = useRef(false);
  const compactTimer = useRef(null); // kept for API compat, no longer auto-triggers

  // Dynamic canvas height = bottom edge of lowest section + padding
  const canvasH = Math.max(
    MIN_HEIGHT,
    ...sections.map(s => {
      const y  = s.props?.y ?? 0;
      const h  = sectionHeights[s.id] ?? (s.props?.layerH ?? 120);
      return y + h + 80;
    }),
    0
  );

  // ── Zoom controls ──────────────────────────────────────────────
  const zoomIn  = () => setZoom(z => Math.min(2, parseFloat((z + 0.1).toFixed(2))));
  const zoomOut = () => setZoom(z => Math.max(0.25, parseFloat((z - 0.1).toFixed(2))));
  const zoomFit = () => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth - 32;
    // Only fit width. Never squish vertically.
    const fitZ = Math.min(vw / CANVAS_W, 1);
    setZoom(parseFloat(fitZ.toFixed(2)));
  };

  const handleSectionHeight = useCallback((id, h) => {
    setSectionHeights(prev => {
      if (prev[id] === h) return prev;
      const next = { ...prev, [id]: h };
      if (onHeightsChange) onHeightsChange(next);
      return next;
    });
  }, [onHeightsChange]);

  // ── Phase-2 auto-layout: once real heights are known, redistribute ──
  useEffect(() => {
    if (hasAutoLayouted.current) return;
    if (sections.length === 0) return;
    if (!onRelayoutWithHeights) return;
    // Wait until at least 80% of sections have reported heights
    const measured = Object.keys(sectionHeights).length;
    if (measured < Math.ceil(sections.length * 0.8)) return;
    hasAutoLayouted.current = true;
    onRelayoutWithHeights(sectionHeights);
  }, [sectionHeights, sections.length, onRelayoutWithHeights]);


  // ── Ctrl+Wheel zoom ───────────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(z => {
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        return Math.max(0.25, Math.min(2, parseFloat((z + delta).toFixed(2))));
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT / CENTER viewport ── */}
      <div
        ref={viewportRef}
        data-free-canvas-scroll="true"
        className="flex-1 overflow-auto builder-bg relative"
        style={{ cursor: 'default' }}
        onClick={(e) => { if (e.target === e.currentTarget) onSelectSection(null); }}
      >
        {/* Centered scrollable wrapper – dimensions match zoomed canvas */}
        <div
          style={{
            minWidth:  CANVAS_W * zoom + 64,
            minHeight: canvasH  * zoom + 64,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          {/* ── THE PAGE (canvas) ── */}
          <div
            style={{
              width: CANVAS_W,
              height: canvasH,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'relative',
              flexShrink: 0,
              fontFamily: globalTheme?.fontFamily
                ? `"${globalTheme.fontFamily}", serif`
                : undefined,
              ...getBodyBgStyle(globalTheme),
            }}
            className="shadow-2xl"
            onClick={(e) => { if (e.target === e.currentTarget) onSelectSection(null); }}
          >
            {/* Dot-grid background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(180,180,210,.35) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Sections rendered by ascending zIndex */}
            {[...sections]
              .sort((a, b) => (a.props?.zIndex ?? 1) - (b.props?.zIndex ?? 1))
              .map((section) => (
                <FreeSectionItem
                  key={section.id}
                  section={section}
                  allSections={sections}
                  sectionHeights={sectionHeights}
                  isSelected={selectedSectionId === section.id}
                  onSelect={onSelectSection}
                  onDelete={onDeleteSection}
                  onDuplicate={onDuplicateSection}
                  onOpenSettings={onOpenSettings}
                  onUpdateProps={onUpdateProps}
                  onHeightChange={handleSectionHeight}
                  onDragEnd={() => {}}
                  zoom={zoom}
                  canvasW={CANVAS_W}
                  canvasH={canvasH}
                  globalTheme={globalTheme}
                />
              ))}

            {sections.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                <span className="text-6xl mb-4">🖼️</span>
                <p className="text-sm text-gray-400 font-medium">Añade bloques y colócalos libremente</p>
                <p className="text-xs text-gray-300 mt-1">Arrastra para posicionar · Ctrl+rueda para hacer zoom</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Layers panel ── */}
      {showLayers && (
        <LayersPanel
          sections={sections}
          sectionHeights={sectionHeights}
          selectedId={selectedSectionId}
          onSelect={onSelectSection}
          onDelete={onDeleteSection}
          onDuplicate={onDuplicateSection}
          onOpenSettings={onOpenSettings}
          onUpdateProps={onUpdateProps}
          onBatchUpdateProps={onBatchUpdateProps}
          zoom={zoom}
          viewportRef={viewportRef}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomFit={zoomFit}
          onRelayout={onRelayout}
          onShowAll={onShowAll}
        />
      )}
    </div>
  );
}

/*─────────────────────────────────────────────────────────────────
  FREE SECTION ITEM
  Each section lives at (x, y) inside the page and can be:
  • Dragged anywhere (mouse events, zoom-corrected)
  • Resized via bottom-right handle
  • Locked / hidden via the layers panel
─────────────────────────────────────────────────────────────────*/
function FreeSectionItem({
  section, allSections = [], sectionHeights = {}, isSelected, onSelect, onDelete, onDuplicate,
  onOpenSettings, onUpdateProps, onHeightChange, onDragEnd, zoom, canvasW, canvasH, globalTheme,
}) {
  const SectionComponent = getSectionComponent(section.type);
  const elRef = useRef(null);

  // Measure real rendered height and report to parent
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        onHeightChange(section.id, Math.round(entry.contentRect.height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [section.id, onHeightChange]);

  const x       = section.props?.x        ?? 0;
  // If y is not set yet, stack after the previous section (use zIndex as fallback order)
  const y       = section.props?.y        ?? ((section.props?.zIndex ?? 1) - 1) * 160;
  const w       = section.props?.layerW   ?? Math.min(canvasW, 390);
  const h       = section.props?.layerH   ?? 'auto';
  const locked  = section.props?.locked   ?? false;
  const hidden  = section.props?.layerHidden ?? false;
  const zIdx    = section.props?.zIndex   ?? 1;

  /* ── Drag ─────────────────────────────────────────────── */
  const handleMouseDown = useCallback((e) => {
    if (locked) return;
    if (e.button !== 0) return;
    if (e.target.closest('[data-no-drag]')) return;
    e.stopPropagation();
    e.preventDefault();

    onSelect(section.id);

    const startMx = e.clientX;
    const startMy = e.clientY;
    const startX  = x;
    const startY  = y;

    const onMove = (ev) => {
      // Client delta divided by zoom → canvas-space delta
      const dx = (ev.clientX - startMx) / zoom;
      const dy = (ev.clientY - startMy) / zoom;
      let nx = Math.round(Math.max(0, Math.min(canvasW - w, startX + dx)));
      let ny = Math.round(Math.max(0, startY + dy)); // Removed canvas bottom constraint to allow dragging infinitely down

      // --- MAGNETIC SNAP ALGORITHM (CANVA-LIKE) ---
      const THRESHOLD = 8;
      let bestDx = THRESHOLD;
      let bestDy = THRESHOLD;
      let snappedX = nx;
      let snappedY = ny;

      // Current moving object boundaries
      const myW = w;
      const myH = typeof h === 'number' ? h : (elRef.current?.offsetHeight ?? 120);
      const myCenter = nx + myW / 2;
      const myMiddle = ny + myH / 2;
      const myRight = nx + myW;
      const myBottom = ny + myH;

      allSections.forEach(other => {
        if (other.id === section.id || (other.props?.layerHidden)) return;
        const ox = other.props?.x ?? 0;
        const oy = other.props?.y ?? 0;
        const ow = other.props?.layerW ?? Math.min(canvasW, 390);
        const oh = sectionHeights[other.id] ?? 120;
        
        const otherCenter = ox + ow / 2;
        const otherMiddle = oy + oh / 2;
        const otherRight = ox + ow;
        const otherBottom = oy + oh;

        // X Snapping
        const xChecks = [
          { my: nx, other: ox, dist: Math.abs(nx - ox) },             // Left to Left
          { my: myCenter, other: otherCenter, dist: Math.abs(myCenter - otherCenter) }, // Center to Center
          { my: myRight, other: otherRight, dist: Math.abs(myRight - otherRight) }     // Right to Right
        ];
        
        xChecks.forEach(chk => {
          if (chk.dist < bestDx) {
            bestDx = chk.dist;
            snappedX = nx - (chk.my - chk.other); // align it
          }
        });

        // Y Snapping
        const yChecks = [
          { my: ny, other: oy, dist: Math.abs(ny - oy) },               // Top to Top
          { my: myMiddle, other: otherMiddle, dist: Math.abs(myMiddle - otherMiddle) }, // Middle to Middle
          { my: myBottom, other: otherBottom, dist: Math.abs(myBottom - otherBottom) }, // Bottom to Bottom
          { my: ny, other: otherBottom, dist: Math.abs(ny - otherBottom) },       // Top to Bottom
          { my: myBottom, other: oy, dist: Math.abs(myBottom - oy) }          // Bottom to Top
        ];

        yChecks.forEach(chk => {
          if (chk.dist < bestDy) {
            bestDy = chk.dist;
            snappedY = ny - (chk.my - chk.other);
          }
        });
      });
      // ---------------------------------------------

      onUpdateProps(section.id, { x: Math.round(snappedX), y: Math.round(snappedY) });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (onDragEnd) onDragEnd();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [locked, x, y, w, h, zoom, section, canvasW, canvasH, onSelect, onUpdateProps, onDragEnd, allSections, sectionHeights]);

  /* ── Resize bottom-right ──────────────────────────────── */
  const handleResizeMouseDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const startMx = e.clientX;
    const startMy = e.clientY;
    const startW  = w;
    const startH  = typeof h === 'number' ? h : (elRef.current?.offsetHeight ?? 120);

    const onMove = (ev) => {
      const nw = Math.max(80, Math.round(startW + (ev.clientX - startMx) / zoom));
      const nh = Math.max(40, Math.round(startH + (ev.clientY - startMy) / zoom));
      onUpdateProps(section.id, { layerW: nw, layerH: nh });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [w, h, zoom, section, onUpdateProps]);

  if (!SectionComponent || hidden) return null;

  return (
    <div
      ref={elRef}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(section.id); }}
      style={{
        position: 'absolute',
        left:    x,
        top:     y,
        width:   w,
        height:  typeof h === 'number' ? h : undefined,
        zIndex:  zIdx,
        cursor:  locked ? 'not-allowed' : 'grab',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
      className={`group ${
        isSelected
          ? 'outline outline-2 outline-pink-500 outline-offset-0'
          : 'hover:outline hover:outline-1 hover:outline-pink-300 hover:outline-offset-0'
      }`}
    >
      {/* ── Top control bar (visible when selected) ── */}
      {isSelected && (
        <div
          data-no-drag
          className="absolute top-1 left-1 z-[9999] flex items-center gap-0.5 bg-gray-900/90 backdrop-blur-sm rounded-lg px-1.5 py-1 shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-[9px] text-gray-400 px-1 font-mono truncate max-w-[90px] select-none">
            {section.type.replace(/_/g, ' ')}
          </span>
          <div className="w-px h-3.5 bg-gray-700 mx-0.5" />
          <CtrlBtn icon={<Settings className="w-3 h-3"/>}    onClick={() => onOpenSettings(section.id)} color="pink" title="Propiedades"/>
          <CtrlBtn icon={<Copy className="w-3 h-3"/>}        onClick={() => onDuplicate(section.id)}    title="Duplicar"/>
          <CtrlBtn
            icon={locked ? <Lock className="w-3 h-3"/> : <Unlock className="w-3 h-3"/>}
            onClick={() => onUpdateProps(section.id, { ...section.props, locked: !locked })}
            color={locked ? 'amber' : undefined}
            title={locked ? 'Desbloquear' : 'Bloquear'}
          />
          <CtrlBtn icon={<Trash2 className="w-3 h-3"/>}      onClick={() => onDelete(section.id)} color="red" title="Eliminar"/>
        </div>
      )}

      {/* ── Content (pointer-events-none so drag works) ── */}
      <div
        style={{
          '--title-font': section.props?.titleFont ? `"${section.props.titleFont}", serif` : (globalTheme?.fontFamily ? `"${globalTheme.fontFamily}", serif` : 'inherit'),
          '--text-font':  section.props?.textFont  ? `"${section.props.textFont}", sans-serif` : (globalTheme?.fontFamily ? `"${globalTheme.fontFamily}", serif` : 'inherit'),
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
        className="section-typography-wrapper"
      >
        {(() => { const bg = getSectionBgStyle(section.props); return bg ? <div style={bg} /> : null; })()}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionComponent props={section.props} />
        </div>
      </div>

      {/* ── Resize handle (bottom-right) ── */}
      {isSelected && !locked && (
        <div
          data-no-drag
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-[9999]"
          style={{ background: 'linear-gradient(135deg, transparent 50%, #ec4899 50%)' }}
        />
      )}

      {/* ── Lock indicator ── */}
      {locked && (
        <div className="absolute top-1 right-1 z-[9998] bg-amber-500/80 rounded p-0.5">
          <Lock className="w-2.5 h-2.5 text-white"/>
        </div>
      )}
    </div>
  );
}

/*─────────────────────────────────────────────────────────────────
  LAYERS PANEL (right sidebar) – dark theme, Photoshop style
  Drag-and-drop reordering: layers sorted by descending z-index.
  Dragging a layer up = higher z-index (in front).
  Dragging a layer down = lower z-index (behind).
─────────────────────────────────────────────────────────────────*/
function LayersPanel({
  sections, sectionHeights = {}, selectedId, onSelect, onDelete, onDuplicate,
  onOpenSettings, onUpdateProps, onBatchUpdateProps,
  zoom, viewportRef, onZoomIn, onZoomOut, onZoomFit,
  onRelayout, onShowAll,
}) {
  // Layers sorted by descending z-index (top layer = highest z = first in list)
  const sorted = [...sections].sort((a, b) => (b.props?.zIndex ?? 1) - (a.props?.zIndex ?? 1));

  // Smooth-scroll the canvas viewport to the section's position
  const scrollToSection = useCallback((section) => {
    const vp = viewportRef?.current;
    if (!vp) return;
    const sy = (section.props?.y ?? 0) * zoom;
    const sx = (section.props?.x ?? 0) * zoom;
    const vpH = vp.clientHeight;
    const vpW = vp.clientWidth;
    // Center the section in the viewport (offset by padding=32)
    const targetY = Math.max(0, sy + 32 - vpH / 3);
    const targetX = Math.max(0, sx + 32 - vpW / 3);
    vp.scrollTo({ top: targetY, left: targetX, behavior: 'smooth' });
  }, [viewportRef, zoom]);

  // ── Drag-and-drop state ──
  const [dragId, setDragId]       = useState(null);
  const [dropIdx, setDropIdx]     = useState(null);
  const listRef                   = useRef(null);

  const handleDragStart = (e, sectionId) => {
    setDragId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image – we show the indicator line instead
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIdx(idx);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (!dragId) return;

    const fromIdx = sorted.findIndex(s => s.id === dragId);
    if (fromIdx === -1 || fromIdx === targetIdx) { setDragId(null); setDropIdx(null); return; }

    // Build new order: move the dragged item to target position
    const newOrder = [...sorted];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(targetIdx, 0, moved);

    // Batch-reassign z-index: first in list = highest z, last = z=1
    const total = newOrder.length;
    const updates = {};
    newOrder.forEach((section, i) => {
      const newZ = total - i;
      if ((section.props?.zIndex ?? 1) !== newZ) {
        updates[section.id] = { zIndex: newZ };
      }
    });
    if (Object.keys(updates).length > 0) {
      onBatchUpdateProps(updates);
    }

    setDragId(null);
    setDropIdx(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDropIdx(null);
  };

  const bringToFront = (section) => {
    const max = Math.max(...sections.map(s => s.props?.zIndex ?? 1), 1);
    onUpdateProps(section.id, { ...section.props, zIndex: max + 1 });
  };

  const sendToBack = (section) => {
    onUpdateProps(section.id, { ...section.props, zIndex: 0 });
  };

  // Type-based color chips
  const typeColors = {
    hero: '#ff4d8f', text: '#6366f1', gallery: '#10b981',
    divider: '#f59e0b', countdown: '#3b82f6', map: '#14b8a6',
    music_player: '#8b5cf6', rsvp: '#ef4444', couple: '#ec4899',
    schedule: '#8b5cf6', dress_code: '#f97316', gifts: '#10b981',
    quote: '#6366f1', hospedaje: '#06b6d4', menu_event: '#84cc16',
    image: '#f43f5e', video: '#a855f7', mask: '#ec4899',
  };

  return (
    <div className="w-56 flex-shrink-0 bg-gray-950 border-l border-gray-800 flex flex-col text-xs overflow-hidden">

      {/* ── Zoom controls ── */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-1">
        <button onClick={onZoomOut} className="text-gray-400 hover:text-white p-1 rounded" title="Alejar">
          <ZoomOut className="w-3.5 h-3.5"/>
        </button>
        <button
          onClick={onZoomFit}
          className="flex-1 text-center text-gray-400 hover:text-white text-[10px] font-mono py-0.5 rounded hover:bg-gray-800"
          title="Ajustar a pantalla"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={onZoomIn} className="text-gray-400 hover:text-white p-1 rounded" title="Acercar">
          <ZoomIn className="w-3.5 h-3.5"/>
        </button>
        <button onClick={onZoomFit} className="text-gray-500 hover:text-white p-1 rounded" title="Ajustar">
          <Maximize2 className="w-3 h-3"/>
        </button>
      </div>

      {/* ── Header ── */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="font-bold text-gray-300 uppercase tracking-widest text-[10px]">Capas</span>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">{sections.length}</span>
          {sections.some(s => s.props?.layerHidden) && (
            <button
              onClick={onShowAll}
              className="text-[9px] bg-amber-600 hover:bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold"
              title="Algunos bloques están ocultos"
            >
              {sections.filter(s => s.props?.layerHidden).length} ocultos
            </button>
          )}
          <button
            onClick={() => onRelayout(sectionHeights)}
            className="text-[9px] bg-violet-700 hover:bg-violet-600 text-white px-1.5 py-0.5 rounded font-bold"
            title="Redistribuir todos los bloques verticalmente (uno debajo del otro)"
          >
            ↕ Distribuir
          </button>
        </div>
      </div>

      {/* ── Drag-and-drop Layer list ── */}
      <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar py-1">
        {sorted.length === 0 && (
          <p className="text-gray-600 text-center py-8 px-3 leading-relaxed">
            Sin capas.<br/>Añade un bloque para empezar.
          </p>
        )}

        {sorted.map((section, idx) => {
          const hidden   = section.props?.layerHidden ?? false;
          const locked   = section.props?.locked ?? false;
          const isActive = selectedId === section.id;
          const zIndex   = section.props?.zIndex ?? 1;
          const label    = section.type.replace(/_/g, ' ');
          const color    = typeColors[section.type] || '#6b7280';
          const isDragging = dragId === section.id;

          return (
            <div key={section.id}>
              {/* Drop indicator line */}
              {dropIdx === idx && dragId && dragId !== section.id && (
                <div className="h-0.5 bg-pink-500 mx-2 rounded-full" />
              )}

              <div
                draggable
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => { onSelect(section.id); scrollToSection(section); }}
                className={`relative flex items-center gap-1.5 px-2 py-2 border-b border-gray-800/50 group transition-all ${
                  isDragging
                    ? 'opacity-40 bg-gray-900'
                    : isActive
                      ? 'bg-pink-950/60 border-l-2 border-l-pink-500 pl-[6px]'
                      : 'hover:bg-gray-800/40'
                } cursor-grab active:cursor-grabbing`}
              >
                {/* Drag handle */}
                <div className="flex flex-col gap-px flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity mr-0.5" title="Arrastra para reordenar">
                  <div className="w-2.5 h-[2px] bg-gray-500 rounded-full"/>
                  <div className="w-2.5 h-[2px] bg-gray-500 rounded-full"/>
                  <div className="w-2.5 h-[2px] bg-gray-500 rounded-full"/>
                </div>

                {/* Color chip / type indicator */}
                <div
                  className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ background: color, fontSize: 8 }}
                >
                  {label.charAt(0).toUpperCase()}
                </div>

                {/* Layer name */}
                <span className={`flex-1 truncate ${
                  isActive ? 'text-pink-300 font-semibold' : hidden ? 'text-gray-600 line-through' : 'text-gray-300'
                }`}>
                  {label}
                </span>

                {/* Z badge */}
                <span className="text-[9px] text-gray-600 font-mono flex-shrink-0">z{zIndex}</span>

                {/* Visibility */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateProps(section.id, { ...section.props, layerHidden: !hidden });
                  }}
                  className="text-gray-600 hover:text-gray-200 flex-shrink-0 transition-colors"
                  title={hidden ? 'Mostrar' : 'Ocultar'}
                >
                  {hidden ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                </button>

                {/* Lock */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateProps(section.id, { ...section.props, locked: !locked });
                  }}
                  className={`flex-shrink-0 transition-colors ${locked ? 'text-amber-400' : 'text-gray-600 hover:text-gray-200'}`}
                  title={locked ? 'Desbloquear' : 'Bloquear'}
                >
                  {locked ? <Lock className="w-3 h-3"/> : <Unlock className="w-3 h-3"/>}
                </button>
              </div>
            </div>
          );
        })}

        {/* Drop indicator at the very bottom */}
        {dragId && dropIdx === sorted.length && (
          <div className="h-0.5 bg-pink-500 mx-2 rounded-full" />
        )}

        {/* Invisible drop zone at the end of the list */}
        {dragId && (
          <div
            className="h-8"
            onDragOver={(e) => { e.preventDefault(); setDropIdx(sorted.length); }}
            onDrop={(e) => handleDrop(e, sorted.length)}
          />
        )}
      </div>

      {/* ── Quick actions for selected layer ── */}
      {selectedId && (() => {
        const sel = sections.find(s => s.id === selectedId);
        if (!sel) return null;
        return (
          <div className="border-t border-gray-800 px-3 py-2 space-y-1">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Capa seleccionada</p>
            <div className="grid grid-cols-2 gap-1">
              <SmallBtn label="Al frente" onClick={() => bringToFront(sel)}/>
              <SmallBtn label="Al fondo"  onClick={() => sendToBack(sel)}/>
              <SmallBtn label="Duplicar"  onClick={() => onDuplicate(selectedId)}/>
              <SmallBtn label="Eliminar"  onClick={() => onDelete(selectedId)} danger/>
            </div>
            <button
              onClick={() => onOpenSettings(selectedId)}
              className="w-full mt-1 py-1.5 rounded-lg text-[10px] font-bold text-white bg-pink-600 hover:bg-pink-500 transition-colors"
            >
              ⚙ Editar propiedades
            </button>
          </div>
        );
      })()}
    </div>
  );
}

function SmallBtn({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`py-1 rounded text-[10px] font-medium transition-colors ${
        danger
          ? 'bg-red-900/60 hover:bg-red-700 text-red-300 hover:text-white'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function CtrlBtn({ icon, onClick, title, color }) {
  const cls = {
    pink:  'hover:bg-pink-600 hover:text-white',
    red:   'hover:bg-red-600 hover:text-white',
    amber: 'text-amber-400 hover:bg-amber-700 hover:text-white',
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`w-5 h-5 flex items-center justify-center rounded text-gray-300 transition-colors ${cls[color] || 'hover:bg-gray-700 hover:text-white'}`}
    >
      {icon}
    </button>
  );
}
