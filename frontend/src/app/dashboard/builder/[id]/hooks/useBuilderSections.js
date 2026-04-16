'use client';
import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { getDefaultProps } from '../config/sectionTypes';

// Estimated heights per block type — must match page.jsx BLOCK_HEIGHTS
const BLOCK_HEIGHTS = {
  hero: 350, divider: 50, text: 150, quote: 130,
  gallery: 450, gifts: 320, schedule: 650, countdown: 200,
  map: 300, rsvp: 280, music_player: 100, couple: 280,
  video: 300, hospedaje: 250, dress_code: 200, confirm: 250,
  photo_upload: 400, menu_event: 250, image: 300, mask: 360,
};
const DEFAULT_HEIGHT = 200;
const GAP = 12;

/**
 * Section CRUD operations for the builder.
 * @param {React.MutableRefObject} sectionsRef - Always-fresh ref to sections
 * @param {Function} updateSections - Wrapped setSections that marks dirty + auto-saves
 * @param {string|null} selectedId - Currently selected section ID
 * @param {Function} setSelectedId - Set selected section ID
 * @param {React.MutableRefObject} [measuredHeightsRef] - Ref to real section heights from FreeCanvas
 */
export default function useBuilderSections(sectionsRef, updateSections, selectedId, setSelectedId, measuredHeightsRef) {
  const handleAddBlock = useCallback((type) => {
    const current = sectionsRef.current;
    const maxZ = current.length > 0 ? Math.max(...current.map(s => s.props?.zIndex ?? 1)) : 0;
    const realHeights = measuredHeightsRef?.current ?? {};

    // Calculate Y position using real measured heights when available, fallback to estimates
    let nextY = 0;
    if (current.length > 0) {
      const maxBottom = current.reduce((acc, s) => {
        const h = realHeights[s.id] ?? BLOCK_HEIGHTS[s.type] ?? DEFAULT_HEIGHT;
        const bottom = (s.props?.y ?? 0) + h;
        return bottom > acc ? bottom : acc;
      }, 0);
      nextY = maxBottom + GAP;
    }

    const newSection = {
      id:    `section-${Date.now()}`,
      type,
      order: current.length + 1,
      props: {
        ...getDefaultProps(type),
        x: 0,
        y: nextY,
        zIndex: maxZ + 1,
        layerW: 390,
      },
    };
    const newSections = [...current, newSection].map((s, i) => ({ ...s, order: i + 1 }));
    updateSections(newSections);
    setSelectedId(newSection.id);

    // Scroll to the new block after it renders
    setTimeout(() => {
      const canvas = document.querySelector('[data-canvas-scroll]') || document.querySelector('[data-free-canvas-scroll]');
      if (canvas) canvas.scrollTo({ top: canvas.scrollHeight, behavior: 'smooth' });
    }, 150);
  }, [sectionsRef, updateSections, setSelectedId]);

  const handleDelete = useCallback((sid) => {
    updateSections(sectionsRef.current.filter(s => s.id !== sid));
    if (selectedId === sid) setSelectedId(null);
  }, [sectionsRef, updateSections, selectedId, setSelectedId]);

  const handleDuplicate = useCallback((sid) => {
    const current = sectionsRef.current;
    const idx = current.findIndex(s => s.id === sid);
    if (idx === -1) return;
    const dup = { ...current[idx], id: `section-${Date.now()}` };
    const ns  = [...current];
    ns.splice(idx + 1, 0, dup);
    updateSections(ns.map((s, i) => ({ ...s, order: i + 1 })));
    setSelectedId(dup.id);
  }, [sectionsRef, updateSections, setSelectedId]);

  const handleMoveUp = useCallback((sid) => {
    const current = sectionsRef.current;
    const i = current.findIndex(s => s.id === sid);
    if (i <= 0) return;
    updateSections(arrayMove(current, i, i - 1).map((s, j) => ({ ...s, order: j + 1 })));
  }, [sectionsRef, updateSections]);

  const handleMoveDown = useCallback((sid) => {
    const current = sectionsRef.current;
    const i = current.findIndex(s => s.id === sid);
    if (i >= current.length - 1) return;
    updateSections(arrayMove(current, i, i + 1).map((s, j) => ({ ...s, order: j + 1 })));
  }, [sectionsRef, updateSections]);

  const handleUpdateProps = useCallback((sid, newProps) => {
    updateSections(sectionsRef.current.map(s => s.id === sid ? { ...s, props: { ...s.props, ...newProps } } : s));
  }, [sectionsRef, updateSections]);

  /** Batch-update props for multiple sections at once (avoids stale-state loop).
   *  @param {Object} updates – { [sectionId]: propsToMerge } */
  const handleBatchUpdateProps = useCallback((updates) => {
    updateSections(sectionsRef.current.map(s => {
      const patch = updates[s.id];
      return patch ? { ...s, props: { ...s.props, ...patch } } : s;
    }));
  }, [sectionsRef, updateSections]);

  return {
    handleAddBlock,
    handleDelete,
    handleDuplicate,
    handleMoveUp,
    handleMoveDown,
    handleUpdateProps,
    handleBatchUpdateProps,
  };
}
