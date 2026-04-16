'use client';
import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { sanitizeImageUrl } from '../utils/sanitizeUrl';

export default function ImageSection({ props }) {
  const { src, alt, width, height, objectFit, borderRadius, paddingY, srcPos, srcFilter } = props;
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeImageUrl(src);

  if (!safeSrc || failed) {
    return (
      <div style={{ padding: `${paddingY || '20px'} 20px`, textAlign: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ width: '64px', height: '64px', background: '#e5e7eb', borderRadius: '12px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageIcon size={24} color="#9ca3af" />
        </div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>{failed ? 'No se pudo cargar la imagen' : 'Selecciona una imagen'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: `${paddingY || '20px'} 20px`, textAlign: 'center' }}>
      <img
        src={safeSrc}
        alt={alt || 'Imagen'}
        style={{
          width: width || '100%',
          height: height || 'auto',
          objectFit: objectFit || 'cover',
          objectPosition: srcPos || '50% 50%',
          borderRadius: borderRadius || '0px',
          maxWidth: '100%',
          filter: srcFilter || undefined,
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
