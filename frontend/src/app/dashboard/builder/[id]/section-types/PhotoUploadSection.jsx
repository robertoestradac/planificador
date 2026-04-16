'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';

export default function PhotoUploadSection({ props, invitationId }) {
  const {
    title, subtitle, textColor, accentColor, buttonText,
    buttonColor, maxPhotos, columns, paddingY, titleFont, textFont,
  } = props;

  const accent = accentColor || '#7c3aed';
  const cols = columns || 3;
  const max = maxPhotos || 100;
  const isPublic = !!invitationId;

  const PAGE_SIZE = 9;

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileRef = useRef(null);

  // Fetch photos on public page
  useEffect(() => {
    if (!isPublic) return;
    setLoadingPhotos(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/event-photos/${invitationId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setPhotos(data.data.photos || []);
      })
      .catch(() => {})
      .finally(() => setLoadingPhotos(false));
  }, [invitationId, isPublic]);

  const handleUpload = useCallback(async (files) => {
    if (!isPublic || !files?.length) return;
    setUploading(true);
    const apiBase = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1`;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const fd = new FormData();
      fd.append('photo', file);
      if (uploaderName.trim()) fd.append('uploader_name', uploaderName.trim());

      try {
        const res = await fetch(`${apiBase}/event-photos/${invitationId}`, {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (data.success) {
          setPhotos(prev => [data.data, ...prev]);
          setCurrentPage(1); // jump to first page so new photo is visible
        }
      } catch {}
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }, [isPublic, invitationId, uploaderName]);

  // Drop handler
  const [dragOver, setDragOver] = useState(false);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  // ── Builder preview (not public) ──
  if (!isPublic) {
    return (
      <div style={{ padding: `${paddingY || '60px'} 20px`, textAlign: 'center' }}>
        {title && (
          <h2 style={{
            fontFamily: 'var(--title-font, inherit)',
            fontSize: '28px', fontWeight: '600',
            color: textColor || '#1a1a2e', margin: '0 0 8px',
          }}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p style={{
            fontFamily: 'var(--text-font, inherit)',
            fontSize: '16px', color: textColor || '#6b7280',
            margin: '0 0 32px', opacity: 0.85,
          }}>
            {subtitle}
          </p>
        )}

        <div style={{
          maxWidth: '320px', margin: '0 auto',
          border: `2px dashed ${accent}40`, borderRadius: '20px',
          padding: '40px 24px', background: `${accent}06`,
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: `${accent}15`, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={28} color={accent} />
          </div>
          <p style={{ color: textColor || '#374151', fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>
            {buttonText || 'Subir mis fotos'}
          </p>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
            Los invitados podrán subir fotos del evento aquí
          </p>
        </div>

        {/* Preview placeholder grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '8px', maxWidth: '400px', margin: '24px auto 0',
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: '12px',
              background: '#f3f4f6', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <ImagePlus size={20} color="#d1d5db" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Public page (functional) ──
  return (
    <div style={{ padding: `${paddingY || '60px'} 20px`, textAlign: 'center' }}>
      {title && (
        <h2 style={{
          fontFamily: 'var(--title-font, inherit)',
          fontSize: '28px', fontWeight: '600',
          color: textColor || '#1a1a2e', margin: '0 0 8px',
        }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p style={{
          fontFamily: 'var(--text-font, inherit)',
          fontSize: '16px', color: textColor || '#6b7280',
          margin: '0 0 28px', opacity: 0.85, lineHeight: 1.6,
        }}>
          {subtitle}
        </p>
      )}

      {/* Uploader name */}
      <div style={{ maxWidth: '360px', margin: '0 auto 20px' }}>
        <input
          value={uploaderName}
          onChange={e => setUploaderName(e.target.value)}
          placeholder="Tu nombre (opcional)"
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '12px',
            border: '1.5px solid #e5e7eb', fontSize: '15px', outline: 'none',
            boxSizing: 'border-box', background: '#f9fafb',
            textAlign: 'center', transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = accent; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
        />
      </div>

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && photos.length < max && fileRef.current?.click()}
        style={{
          maxWidth: '360px', margin: '0 auto 28px',
          border: `2px dashed ${dragOver ? accent : `${accent}40`}`,
          borderRadius: '20px', padding: '32px 24px',
          background: dragOver ? `${accent}10` : `${accent}06`,
          cursor: uploading || photos.length >= max ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />

        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={32} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: accent, fontSize: '15px', fontWeight: '600', margin: 0 }}>Subiendo foto...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : photos.length >= max ? (
          <div>
            <p style={{ color: '#9ca3af', fontSize: '15px', margin: 0 }}>Se alcanzó el límite de fotos</p>
          </div>
        ) : (
          <>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: `${accent}15`, margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={24} color={accent} />
            </div>
            <p style={{ color: textColor || '#374151', fontSize: '15px', fontWeight: '600', margin: '0 0 4px' }}>
              {buttonText || 'Subir mis fotos'}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
              Toca aquí o arrastra tus fotos
            </p>
          </>
        )}
      </div>

      {/* Loading */}
      {loadingPhotos && (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={24} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Photo grid — paginated 9 per page */}
      {photos.length > 0 && (
        <>
          {/* Photo count + page info */}
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 16px' }}>
            {photos.length} foto{photos.length !== 1 ? 's' : ''} compartida{photos.length !== 1 ? 's' : ''}
            {Math.ceil(photos.length / PAGE_SIZE) > 1 && (
              <span> · página {currentPage} de {Math.ceil(photos.length / PAGE_SIZE)}</span>
            )}
          </p>
          {(() => {
            const totalPages = Math.ceil(photos.length / PAGE_SIZE);
            const start = (currentPage - 1) * PAGE_SIZE;
            const pagePhotos = photos.slice(start, start + PAGE_SIZE);
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '8px', maxWidth: '600px', margin: '0 auto',
              }}>
                {pagePhotos.map((photo) => {
                  const globalIndex = photos.indexOf(photo);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => setLightbox(globalIndex)}
                      style={{
                        position: 'relative', aspectRatio: '1',
                        borderRadius: '12px', overflow: 'hidden',
                        cursor: 'pointer', background: '#f3f4f6',
                      }}
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.uploader_name ? `Foto de ${photo.uploader_name}` : `Foto ${globalIndex + 1}`}
                        loading="lazy"
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          display: 'block', transition: 'transform 0.3s',
                        }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                      {photo.uploader_name && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '6px 8px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                          color: '#fff', fontSize: '11px', textAlign: 'center',
                          fontFamily: 'var(--text-font, inherit)',
                        }}>
                          {photo.uploader_name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Pagination controls */}
          {Math.ceil(photos.length / PAGE_SIZE) > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px', marginTop: '20px',
            }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: currentPage === 1 ? '#f3f4f6' : `${accent}15`,
                  color: currentPage === 1 ? '#d1d5db' : accent,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {currentPage} / {Math.ceil(photos.length / PAGE_SIZE)}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(photos.length / PAGE_SIZE), p + 1))}
                disabled={currentPage === Math.ceil(photos.length / PAGE_SIZE)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: currentPage === Math.ceil(photos.length / PAGE_SIZE) ? '#f3f4f6' : `${accent}15`,
                  color: currentPage === Math.ceil(photos.length / PAGE_SIZE) ? '#d1d5db' : accent,
                  cursor: currentPage === Math.ceil(photos.length / PAGE_SIZE) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightbox(l => Math.max(0, l - 1)); }}
            style={{
              position: 'absolute', left: '16px', background: 'rgba(255,255,255,0.15)',
              border: 'none', color: '#fff', width: '44px', height: '44px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <img
            src={photos[lightbox].photo_url}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={e => { e.stopPropagation(); setLightbox(l => Math.min(photos.length - 1, l + 1)); }}
            style={{
              position: 'absolute', right: '16px', background: 'rgba(255,255,255,0.15)',
              border: 'none', color: '#fff', width: '44px', height: '44px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}
          >
            <ChevronRight size={24} />
          </button>
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)',
              border: 'none', color: '#fff', width: '36px', height: '36px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}
          >
            <X size={18} />
          </button>
          {/* Photo info */}
          <div style={{
            position: 'absolute', bottom: '24px', color: 'rgba(255,255,255,0.7)',
            fontSize: '14px', textAlign: 'center', zIndex: 10000,
          }}>
            {photos[lightbox].uploader_name && (
              <div style={{ marginBottom: '4px', color: '#fff', fontWeight: '600' }}>
                📸 {photos[lightbox].uploader_name}
              </div>
            )}
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
