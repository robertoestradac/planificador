'use client';
import { useState } from 'react';
import { Film } from 'lucide-react';

export default function VideoSection({ props }) {
  const { title, subtitle, videoUrl, paddingY, autoplay, muted, loop, aspectRatio } = props;

  if (!videoUrl) {
    return (
      <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <Film size={48} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Agrega la URL del video (YouTube, Vimeo o archivo)</p>
      </div>
    );
  }

  // Detectar si es YouTube o Vimeo
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isVimeo   = videoUrl.includes('vimeo.com');

  const getEmbedUrl = (url) => {
    if (isYouTube) {
      const videoId = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (!videoId) return url;
      const params = new URLSearchParams({ rel: 0, modestbranding: 1 });
      if (autoplay) params.set('autoplay', '1');
      if (muted) params.set('mute', '1');
      if (loop) { params.set('loop', '1'); params.set('playlist', videoId); }
      return `https://www.youtube.com/embed/${videoId}?${params}`;
    }
    if (isVimeo) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (!videoId) return url;
      const params = new URLSearchParams({ color: '7c3aed', title: 0, byline: 0, portrait: 0 });
      if (autoplay) params.set('autoplay', '1');
      if (muted) params.set('muted', '1');
      if (loop) params.set('loop', '1');
      return `https://player.vimeo.com/video/${videoId}?${params}`;
    }
    return url;
  };

  const ratio = aspectRatio || '16/9';
  const paddingTop = ratio === '16/9' ? '56.25%' : ratio === '4/3' ? '75%' : ratio === '1/1' ? '100%' : '56.25%';

  return (
    <div style={{ padding: `${paddingY || '40px'} 20px` }}>
      {(title || subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {title && <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px' }}>{title}</h2>}
          {subtitle && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', margin: 0 }}>{subtitle}</p>}
        </div>
      )}
      <div style={{ maxWidth: '900px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        {(isYouTube || isVimeo) ? (
          <div style={{ position: 'relative', paddingTop }}>
            <iframe
              src={getEmbedUrl(videoUrl)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            src={videoUrl}
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            controls
            style={{ width: '100%', display: 'block' }}
          />
        )}
      </div>
    </div>
  );
}
