'use client';
import { Image as ImageIcon } from 'lucide-react';

export default function GifSection({ props }) {
  const {
    gifUrl,
    alt,
    width,
    height,
    objectFit,
    borderRadius,
    paddingY,
    alignment,
    maxWidth,
    shadow,
    opacity,
  } = props;

  if (!gifUrl) {
    return (
      <div style={{ padding: `${paddingY || '20px'} 20px`, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <ImageIcon size={48} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>
          Agrega la URL de un GIF animado
        </p>
      </div>
    );
  }

  const containerStyle = {
    padding: `${paddingY || '20px'} 20px`,
    display: 'flex',
    justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
  };

  const imgStyle = {
    width: width || '100%',
    height: height || 'auto',
    maxWidth: maxWidth || '100%',
    objectFit: objectFit || 'cover',
    borderRadius: borderRadius || '0px',
    display: 'block',
    opacity: opacity !== undefined ? opacity / 100 : 1,
    boxShadow: shadow ? '0 10px 40px rgba(0,0,0,0.2)' : 'none',
  };

  return (
    <div style={containerStyle}>
      <img
        src={gifUrl}
        alt={alt || 'GIF animado'}
        style={imgStyle}
        loading="lazy"
      />
    </div>
  );
}
