'use client';
import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function GallerySection({ props }) {
  const { images, columns, gap, borderRadius, paddingY, title, subtitle, layout, textColor, textFont } = props;
  const [lightbox, setLightbox] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ width: '64px', height: '64px', background: '#e5e7eb', borderRadius: '12px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageIcon size={24} color="#9ca3af" />
        </div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Agrega imágenes a la galería desde el panel de propiedades</p>
      </div>
    );
  }

  const cols = columns || 3;
  const displayLayout = layout || 'polaroid';

  return (
    <div style={{ padding: `${paddingY || '40px'} 20px`, background: '#fff' }}>
      {(title || subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {title && <h2 style={{ fontFamily: 'var(--title-font, inherit)', fontSize: '36px', fontWeight: '400', color: textColor || '#111', margin: '0 0 12px' }}>{title}</h2>}
          {subtitle && <p style={{ fontFamily: 'var(--text-font, inherit)', fontSize: '18px', color: textColor || '#6b7280', margin: 0, opacity: 0.85 }}>{subtitle}</p>}
        </div>
      )}

      {/* Grid layout */}
      {displayLayout === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: gap || '8px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {images.map((imgItem, i) => {
            const url = typeof imgItem === 'object' && imgItem !== null ? imgItem.url : imgItem;
            const cap = typeof imgItem === 'object' && imgItem !== null ? imgItem.caption : '';
            return (
            <div
              key={i}
              onClick={() => setLightbox(i)}
              style={{
                overflow: 'hidden',
                borderRadius: borderRadius || '8px',
                cursor: 'pointer',
                aspectRatio: '1',
                position: 'relative',
              }}
            >
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
              {cap && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#fff', textAlign: 'center', fontFamily: 'var(--text-font, inherit)', fontSize: '14px', zIndex: 10 }}>
                  {cap}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Polaroid Layout (Scattered Instant Photos) */}
      {displayLayout === 'polaroid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: gap || '30px',
          maxWidth: '1000px',
          margin: '20px auto 40px',
          padding: '20px'
        }}>
          {images.map((imgItem, i) => {
            const url = typeof imgItem === 'object' && imgItem !== null ? imgItem.url : imgItem;
            const cap = typeof imgItem === 'object' && imgItem !== null ? imgItem.caption : '';
            // Predetermined subtle scatter rotations
            const rotations = [-6, 4, -3, 5, -7, 6, -4, 8, -5, 3];
            const rot = rotations[i % rotations.length];

            return (
              <div
                key={i}
                onClick={() => setLightbox(i)}
                style={{
                  backgroundColor: '#ffffff',
                  padding: cap ? '12px 12px 16px 12px' : '12px 12px 48px 12px', /* Bottom padding adjusts if caption exists */
                  borderRadius: '2px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  width: '100%',
                  aspectRatio: '0.85',
                  transform: `rotate(${rot}deg)`,
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = `scale(1.1) rotate(0deg) translateY(-8px)`;
                  e.currentTarget.style.zIndex = '50';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = `rotate(${rot}deg)`;
                  e.currentTarget.style.zIndex = '1';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.03)';
                }}
              >
                <div style={{ width: '100%', height: '100%', flex: 1, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                  <img
                    src={url}
                    alt={`Polaroid ${i + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      display: 'block',
                      filter: 'contrast(1.02) saturate(1.05)', /* Slight vintage pop */
                      transition: 'opacity 0.3s'
                    }}
                  />
                </div>
                {cap && (
                  <div style={{ marginTop: '12px', textAlign: 'center', fontFamily: 'var(--text-font, inherit)', color: textColor || '#333333', fontSize: '15px' }}>
                    {cap}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Masonry-style layout */}
      {displayLayout === 'masonry' && (
        <div style={{ columnCount: cols, columnGap: gap || '16px', maxWidth: '1000px', margin: '0 auto' }}>
          {images.map((imgItem, i) => {
            const url = typeof imgItem === 'object' && imgItem !== null ? imgItem.url : imgItem;
            const cap = typeof imgItem === 'object' && imgItem !== null ? imgItem.caption : '';
            return (
            <div
              key={i}
              onClick={() => setLightbox(i)}
              style={{ breakInside: 'avoid', marginBottom: gap || '16px', borderRadius: borderRadius || '8px', overflow: 'hidden', cursor: 'pointer', display: 'inline-block', width: '100%', background: cap ? '#f9fafb' : 'transparent', border: cap ? '1px solid #f3f4f6' : 'none' }}
            >
              <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', display: 'block', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
              {cap && (
                <div style={{ padding: '12px', textAlign: 'center', fontFamily: 'var(--text-font, inherit)', color: textColor || '#555555', fontSize: '14px' }}>
                  {cap}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button 
            style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '32px', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
            onClick={e => { e.stopPropagation(); setLightbox(l => Math.max(0, l - 1)); }}>‹</button>
          <img
            src={typeof images[lightbox] === 'object' && images[lightbox] !== null ? images[lightbox].url : images[lightbox]}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
            onClick={e => e.stopPropagation()}
          />
          {typeof images[lightbox] === 'object' && images[lightbox] !== null && images[lightbox].caption && (
            <div style={{ position: 'absolute', bottom: '60px', color: '#fff', fontSize: '18px', fontFamily: 'var(--text-font, inherit)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {images[lightbox].caption}
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(l => Math.min(images.length - 1, l + 1)); }}
            style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '32px', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>›</button>
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '20px', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', zIndex: 10000 }}>✕</button>
          <div style={{ position: 'absolute', bottom: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', zIndex: 10000 }}>
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
