import { sanitizeImageUrl } from '../utils/sanitizeUrl';

export default function HeroSection({ props }) {
  const {
    title,
    subtitle,
    showTitle = true,
    showSubtitle = true,
    backgroundImage,
    backgroundImagePos,
    backgroundImageFilter,
    textAlign,
    textColor,
    paddingY,
    overlayOpacity,
  } = props;

  const safeBg = sanitizeImageUrl(backgroundImage);

  return (
    <div
      style={{
        textAlign: textAlign || 'center',
        color: textColor || '#1a1a1a',
        padding: `${paddingY || '80px'} 20px`,
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background image layer — filter only affects this div */}
      {safeBg && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${safeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: backgroundImagePos || '50% 50%',
          filter: backgroundImageFilter || undefined,
        }} />
      )}
      {/* Overlay oscuro para contraste */}
      {safeBg && overlayOpacity > 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundColor: `rgba(0,0,0,${(overlayOpacity || 0) / 100})`,
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {showTitle && title && (
          <h1 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 16px', lineHeight: '1.2' }}>
            {title}
          </h1>
        )}
        {showSubtitle && subtitle && (
          <p style={{ fontSize: '20px', margin: '0', opacity: 0.9 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

