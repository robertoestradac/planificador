'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Music, AlertTriangle, Disc3 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   PARSERS
   - Spotify, Deezer, Apple Music → user pastes the FULL <iframe> code
   - YouTube Music → user pastes the share link
   ═══════════════════════════════════════════════════════════════ */

/** Extract the src="..." value from an <iframe> HTML string */
function extractSrcFromIframe(html) {
  if (!html) return null;
  const m = html.match(/src=["']([^"']+)["']/);
  return m ? m[1] : null;
}

function parseSpotify(input) {
  if (!input) return null;
  // Full iframe pasted → extract src
  if (input.trim().startsWith('<')) return extractSrcFromIframe(input);
  // Direct embed URL
  if (input.includes('open.spotify.com/embed')) return input.trim();
  return null;
}

function parseYoutubeMusic(input) {
  if (!input) return null;
  // Already an embed URL
  if (input.includes('youtube.com/embed')) return input.trim();
  // music.youtube.com/watch?v=ID  or  youtube.com/watch?v=ID
  const m = input.match(/(?:music\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // youtu.be/ID
  const m2 = input.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (m2) return `https://www.youtube.com/embed/${m2[1]}`;
  // playlist
  const m3 = input.match(/(?:music\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (m3) return `https://www.youtube.com/embed/videoseries?list=${m3[1]}`;
  return null;
}

function parseDeezer(input) {
  if (!input) return null;
  // Full iframe pasted → extract src
  if (input.trim().startsWith('<')) return extractSrcFromIframe(input);
  // Direct widget URL
  if (input.includes('widget.deezer.com')) return input.trim();
  return null;
}

function parseAppleMusic(input) {
  if (!input) return null;
  // Full iframe pasted → extract src
  if (input.trim().startsWith('<')) return extractSrcFromIframe(input);
  // Direct embed URL
  if (input.includes('embed.music.apple.com')) return input.trim();
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   Platform-specific iframe renderers — match official embeds
   ═══════════════════════════════════════════════════════════════ */

function SpotifyEmbed({ src, height }) {
  return (
    <iframe
      style={{ borderRadius: '12px' }}
      src={src}
      width="100%"
      height={height || 352}
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}

function YouTubeMusicEmbed({ src, height }) {
  return (
    <iframe
      src={src}
      width="100%"
      height={height || 352}
      frameBorder="0"
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      loading="lazy"
      style={{ borderRadius: '12px' }}
    />
  );
}

function DeezerEmbed({ src, height }) {
  return (
    <iframe
      title="deezer-widget"
      src={src}
      width="100%"
      height={height || 300}
      frameBorder="0"
      allowTransparency="true"
      allow="encrypted-media; clipboard-write"
      style={{ borderRadius: '12px' }}
    />
  );
}

function AppleMusicEmbed({ src, height }) {
  return (
    <iframe
      allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
      frameBorder="0"
      height={height || 450}
      style={{
        width: '100%',
        maxWidth: '660px',
        overflow: 'hidden',
        borderRadius: '10px',
      }}
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      src={src}
    />
  );
}

const PLATFORM_CONFIG = {
  spotify:       { label: 'Spotify',       color: '#1DB954', parse: parseSpotify,      Embed: SpotifyEmbed,      defaultH: 352 },
  youtube_music: { label: 'YouTube Music', color: '#FF0000', parse: parseYoutubeMusic, Embed: YouTubeMusicEmbed, defaultH: 352 },
  deezer:        { label: 'Deezer',        color: '#A238FF', parse: parseDeezer,       Embed: DeezerEmbed,       defaultH: 300 },
  apple_music:   { label: 'Apple Music',   color: '#FC3C44', parse: parseAppleMusic,   Embed: AppleMusicEmbed,   defaultH: 450 },
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function MusicPlayerSection({ props }) {
  const {
    playerType = 'custom', title, subtitle, audioUrl, embedUrl,
    autoplay, loop, paddingY, textColor,
    coverImage, coverImagePos, coverImageFilter, embedHeight,
    titleFontSize = '18px', subtitleFontSize = '14px',
  } = props;

  const color = textColor || '#ffffff';

  const platform = PLATFORM_CONFIG[playerType];
  const parsedEmbed = useMemo(
    () => platform ? platform.parse(embedUrl) : null,
    [playerType, embedUrl],
  );

  // ── Streaming platform embed ──
  if (playerType && playerType !== 'custom' && platform) {
    const { label, color: platformColor, Embed, defaultH } = platform;
    const h = embedHeight || defaultH;

    if (!embedUrl) {
      const hint = playerType === 'youtube_music'
        ? `Pega el link de ${label} en las propiedades`
        : `Pega el código iframe de ${label} en las propiedades`;
      return (
        <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <Disc3 size={40} color={platformColor} strokeWidth={1.5} />
          </div>
          {title && <p style={{ color, fontSize: titleFontSize, fontWeight: '700', margin: '10px 0 4px' }}>{title}</p>}
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '13px' }}>{hint}</p>
        </div>
      );
    }

    if (!parsedEmbed) {
      const errHint = playerType === 'youtube_music'
        ? `No se pudo interpretar el link de ${label}. Verifica el enlace.`
        : `No se pudo extraer el src del iframe de ${label}. Verifica el código pegado.`;
      return (
        <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <AlertTriangle size={32} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px', fontSize: '13px' }}>{errHint}</p>
        </div>
      );
    }

    return (
      <div style={{
        padding: `${paddingY || '20px'} 16px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {title && (
          <p style={{ color, fontSize: titleFontSize, fontWeight: '700', textAlign: 'center', margin: '0 0 8px' }}>
            {title}
          </p>
        )}
        {subtitle && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: subtitleFontSize, textAlign: 'center', margin: '0 0 12px' }}>
            {subtitle}
          </p>
        )}
        <div style={{ width: '100%' }}>
          <Embed src={parsedEmbed} height={h} />
        </div>
      </div>
    );
  }

  // ── Custom audio player (original) ──
  return <CustomAudioPlayer
    title={title} subtitle={subtitle} audioUrl={audioUrl}
    autoplay={autoplay} loop={loop} paddingY={paddingY}
    color={color} coverImage={coverImage} coverImagePos={coverImagePos} coverImageFilter={coverImageFilter}
    titleFontSize={titleFontSize} subtitleFontSize={subtitleFontSize}
  />;
}

/* ── Custom audio player sub-component ── */
function CustomAudioPlayer({ title, subtitle, audioUrl, autoplay, loop, paddingY, color, coverImage, coverImagePos, coverImageFilter, titleFontSize = '18px', subtitleFontSize = '14px' }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrent] = useState(0);

  useEffect(() => {
    if (audioRef.current && autoplay) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [audioUrl, autoplay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (!audioUrl) {
    return (
      <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
          <Music size={40} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>Agrega la URL del audio</p>
      </div>
    );
  }

  return (
    <div style={{ padding: `${paddingY || '40px'} 20px`, display: 'flex', justifyContent: 'center' }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        loop={loop}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrent(audioRef.current.currentTime);
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
          }
        }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={() => setPlaying(false)}
      />

      <div style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '24px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Cover art */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
            backgroundSize: 'cover', backgroundPosition: coverImagePos || 'center',
            filter: coverImageFilter || undefined,
            margin: '0 auto',
            animation: playing ? 'spin 8s linear infinite' : 'none',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            border: '4px solid rgba(255,255,255,0.1)',
          }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Song info */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {title && <p style={{ color, fontSize: titleFontSize, fontWeight: '700', margin: '0 0 4px' }}>{title}</p>}
          {subtitle && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: subtitleFontSize, margin: 0 }}>{subtitle}</p>}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
            onClick={(e) => {
              if (!audioRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = pct * audioRef.current.duration;
            }}
          >
            <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, #7c3aed, #ec4899)`, borderRadius: '2px', transition: 'width 0.5s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{formatTime(currentTime)}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer', padding: '8px' }}
          >⏮</button>
          <button
            onClick={togglePlay}
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer', padding: '8px' }}
          >⏭</button>
        </div>
      </div>
    </div>
  );
}
