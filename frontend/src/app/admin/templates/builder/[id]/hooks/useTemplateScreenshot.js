'use client';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { SECTION_COMPONENTS } from '@/app/dashboard/builder/[id]/section-types';
import { getDefaultProps } from '@/app/dashboard/builder/[id]/config/sectionTypes';
import { getSectionBgStyle, getBodyBgStyle } from '@/app/dashboard/builder/[id]/utils/bgStyles';

const PREVIEW_WIDTH = 390;

/**
 * Renders sections into a DOM node that is in the document (required by html2canvas),
 * captures it, uploads the result, and saves preview_image on the template.
 *
 * Usage:
 *   const { captureAndSave, CapturePortal } = useTemplateScreenshot(id, sectionsRef, themeRef);
 *   // Mount <CapturePortal /> somewhere in the JSX tree
 *   // Call captureAndSave() to trigger capture
 */
export default function useTemplateScreenshot(templateId, sectionsRef, themeRef) {
  const capturingRef = useRef(false);
  const containerRef = useRef(null);
  const [showPortal, setShowPortal] = useState(false);

  const captureAndSave = useCallback(async () => {
    if (capturingRef.current) return null;

    const sections = sectionsRef?.current ?? [];
    if (!sections.length) return null;

    capturingRef.current = true;

    try {
      const theme = themeRef?.current ?? {};

      // 1. Show the portal so React renders the sections into the DOM
      setShowPortal(true);

      // 2. Wait for React paint + fonts
      await new Promise(r => setTimeout(r, 900));

      const el = containerRef.current;
      if (!el) {
        console.warn('[screenshot] container ref not found');
        return null;
      }

      // 3. Temporarily make it visible so html2canvas can measure it
      el.style.visibility = 'visible';
      el.style.left = '-9999px'; // keep off-screen but in layout

      const html2canvas = (await import('html2canvas')).default;

      const captureHeight = Math.min(el.scrollHeight || 700, 700);

      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false,
        backgroundColor: theme.background || '#ffffff',
        width: PREVIEW_WIDTH,
        height: captureHeight,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (node) =>
          node.tagName === 'IFRAME' ||
          node.tagName === 'VIDEO' ||
          node.getAttribute?.('data-html2canvas-ignore') === 'true',
      });

      el.style.visibility = 'hidden';

      // 4. Convert to WebP blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.85)
      );
      if (!blob) throw new Error('toBlob returned null');

      // 5. Upload
      const formData = new FormData();
      formData.append('file', blob, `template-${templateId}-preview.webp`);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = data?.data?.url || data?.url || null;
      if (!imageUrl) throw new Error('Upload returned no URL');

      // 6. Persist
      await api.put(`/templates/${templateId}`, { preview_image: imageUrl });

      return imageUrl;
    } catch (err) {
      console.error('[screenshot] failed:', err);
      return null;
    } finally {
      setShowPortal(false);
      capturingRef.current = false;
    }
  }, [templateId, sectionsRef, themeRef]);

  // The portal component — must be rendered inside the page JSX
  const CapturePortal = useCallback(() => {
    if (!showPortal || typeof document === 'undefined') return null;

    const sections = sectionsRef?.current ?? [];
    const theme = themeRef?.current ?? {};
    const bodyStyle = getBodyBgStyle(theme);
    const fontFamily = theme.fontFamily ? `"${theme.fontFamily}", serif` : 'sans-serif';

    return createPortal(
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: PREVIEW_WIDTH,
          fontFamily,
          ...bodyStyle,
          visibility: 'hidden',
          zIndex: -9999,
          pointerEvents: 'none',
          '--theme-primary':    theme.primary    || '#FF4D8F',
          '--theme-secondary':  theme.secondary  || '#7c3aed',
          '--theme-background': theme.background || '#ffffff',
          '--theme-text':       theme.text       || '#1a1a2e',
        }}
      >
        {sections.map((section, i) => {
          const SectionComp = SECTION_COMPONENTS[section.type];
          if (!SectionComp) return null;
          const props = { ...getDefaultProps(section.type), ...section.props };
          const bgStyle = getSectionBgStyle(props);
          return (
            <div key={section.id || i} style={{ position: 'relative' }}>
              {bgStyle && <div style={bgStyle} />}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <SectionComp props={props} theme={theme} isPreview />
              </div>
            </div>
          );
        })}
      </div>,
      document.body
    );
  }, [showPortal, sectionsRef, themeRef]);

  return { captureAndSave, CapturePortal };
}
