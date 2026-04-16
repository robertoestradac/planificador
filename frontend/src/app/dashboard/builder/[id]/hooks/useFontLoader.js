'use client';
import { useEffect } from 'react';
import { FONT_OPTIONS } from '../config/sectionTypes';

/**
 * Preloads all catalog fonts (weight 400) for builder UI previews,
 * and loads per-section + global theme fonts with full weights.
 */
export default function useFontLoader(sections, globalThemeFontFamily) {
  // ── Preload All Catalog Fonts for Builder UI Previews (Weight 400 only) ──
  useEffect(() => {
    const catalog = FONT_OPTIONS.filter(Boolean);
    if (catalog.length === 0) return;

    const familyQuery = catalog.map(f => f.replace(/ /g, '+')).join('|');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css?family=${familyQuery}&display=swap`;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // ── Load Custom Google Fonts (Global + Per Module - Fully Weighted) ──
  useEffect(() => {
    const fontsToLoad = new Set();
    if (globalThemeFontFamily) fontsToLoad.add(globalThemeFontFamily);
    sections.forEach(s => {
      if (s.props?.titleFont) fontsToLoad.add(s.props.titleFont);
      if (s.props?.textFont) fontsToLoad.add(s.props.textFont);
    });

    if (fontsToLoad.size === 0) return;

    const fontLinks = [];
    fontsToLoad.forEach(font => {
      const fontName = encodeURIComponent(font);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css?family=${fontName}:300,400,500,600,700&display=swap`;
      document.head.appendChild(link);
      fontLinks.push(link);
    });

    return () => fontLinks.forEach(link => document.head.removeChild(link));
  }, [sections, globalThemeFontFamily]);
}
