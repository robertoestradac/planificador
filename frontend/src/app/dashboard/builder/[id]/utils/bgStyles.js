import { sanitizeImageUrl } from './sanitizeUrl';

/** Converts hex color + opacity (0-100) to rgba string used in pattern {c} placeholder */
export function patternLineColor(hex = '#000000', opacity = 12) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

/**
 * Returns an inline style object for the invitation body background wrapper.
 * Used in Canvas and FreeCanvas to apply bodyBgType/Color/Gradient/Image from globalTheme.
 */
export function getBodyBgStyle(theme = {}) {
  const t = theme.bodyBgType;
  if (!t || t === 'none') return { background: '#ffffff' };
  switch (t) {
    case 'color':
      return { background: theme.bodyBgColor || '#ffffff' };
    case 'gradient':
      return { background: theme.bodyBgGradient || '#ffffff' };
    case 'image': {
      const url = sanitizeImageUrl(theme.bodyBgImage);
      if (!url) return { background: '#ffffff' };
      return {
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'center top',
      };
    }
    case 'pattern': {
      const lineColor = patternLineColor(theme.bodyBgPatternColor || '#000000', theme.bodyBgPatternOpacity ?? 12);
      const patternCss = (theme.bodyBgPattern || '').replace(/\{c\}/g, lineColor);
      return {
        backgroundImage: patternCss || 'none',
        backgroundSize: theme.bodyBgPatternSize || '24px 24px',
        backgroundColor: theme.bodyBgPatternBase || '#ffffff',
      };
    }
    default:
      return { background: '#ffffff' };
  }
}

/**
 * Generates inline style object for the universal section background layer.
 * Returns a style for an absolutely-positioned overlay div that sits behind content.
 */
export function getSectionBgStyle(props = {}) {
  const { bgType, bgColor, bgGradient, bgImage, bgOpacity } = props;
  if (!bgType || bgType === 'none') return null;

  const opacity = (bgOpacity ?? 100) / 100;

  const base = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity,
    zIndex: 0,
  };

  switch (bgType) {
    case 'color':
      if (!bgColor) return null;
      return { ...base, backgroundColor: bgColor };

    case 'gradient':
      if (!bgGradient) return null;
      return { ...base, background: bgGradient };

    case 'image': {
      const safeUrl = sanitizeImageUrl(bgImage);
      if (!safeUrl) return null;
      return {
        ...base,
        backgroundImage: `url(${safeUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
      };
    }

    default:
      return null;
  }
}
