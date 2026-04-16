'use client';
import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

/**
 * Manages auto-save, manual save, dirty state, and last-saved timestamp.
 * @param {string} id - Invitation ID
 * @param {React.MutableRefObject} sectionsRef - Always-fresh ref to sections
 * @param {React.MutableRefObject} themeRef - Always-fresh ref to globalTheme
 * @param {React.MutableRefObject} canvasModeRef - Always-fresh ref to canvasMode
 */
export default function useAutoSave(id, sectionsRef, themeRef, canvasModeRef) {
  const [isDirty,   setIsDirty]   = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const autoSaveTimer = useRef(null);

  const autoSave = useCallback(async () => {
    try {
      const builder_json = JSON.stringify({
        sections: sectionsRef.current,
        theme: { ...themeRef.current, canvasMode: canvasModeRef.current },
      });
      await api.patch(`/invitations/${id}/builder`, { builder_json, html: '', css: '' });
      setIsDirty(false);
      setLastSaved(new Date());
    } catch {}
  }, [id, sectionsRef, themeRef, canvasModeRef]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const builder_json = JSON.stringify({
        sections: sectionsRef.current,
        theme: { ...themeRef.current, canvasMode: canvasModeRef.current },
      });
      await api.patch(`/invitations/${id}/builder`, { builder_json, html: '', css: '' });
      setIsDirty(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: err.response?.data?.message });
    } finally {
      setSaving(false);
    }
  }, [id, saving, sectionsRef, themeRef, canvasModeRef]);

  const scheduleAutoSave = useCallback((delayMs = 5000) => {
    setIsDirty(true);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSave(), delayMs);
  }, [autoSave]);

  const cleanup = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
  }, []);

  return {
    isDirty, setIsDirty,
    lastSaved,
    saving,
    handleSave,
    autoSave,
    scheduleAutoSave,
    autoSaveTimer,
    cleanup,
  };
}
