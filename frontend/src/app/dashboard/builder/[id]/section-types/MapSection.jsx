import { MapPin, Navigation, Map } from 'lucide-react';

/** Extract the src="..." value from an <iframe> HTML string */
function extractSrcFromIframe(html) {
  if (!html) return null;
  const m = html.match(/src=["']([^"']+)["']/);
  return m ? m[1] : null;
}

function parseGoogleMaps(input) {
  if (!input) return null;
  // Full iframe pasted → extract src
  if (input.trim().startsWith('<')) return extractSrcFromIframe(input);
  // Direct embed URL
  if (input.includes('google.com/maps')) return input.trim();
  return null;
}

function parseWaze(input) {
  if (!input) return null;
  const trimmed = input.trim();
  // Accept any waze link
  if (trimmed.includes('waze.com')) return trimmed;
  return null;
}

export default function MapSection({ props }) {
  const { title, address, embedUrl, height, paddingY, textColor, mapType = 'google_maps' } = props;
  const color = textColor || '#1a1a1a';

  // ── Google Maps ──
  if (mapType === 'google_maps') {
    const src = parseGoogleMaps(embedUrl);

    if (!src) {
      return (
        <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <Map size={40} color="#9ca3af" strokeWidth={1.5} />
          </div>
          <p style={{ color: '#999', fontSize: '14px' }}>Pega el código iframe de Google Maps en las propiedades</p>
        </div>
      );
    }

    return (
      <div style={{ padding: `${paddingY || '40px'} 20px` }}>
        {title && <h3 style={{ textAlign: 'center', marginBottom: '12px', fontSize: '24px', color, fontWeight: '700' }}>{title}</h3>}
        {address && (
          <p style={{ textAlign: 'center', marginBottom: '20px', color: `${color}88`, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <MapPin size={14} /> {address}
          </p>
        )}
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <iframe
            src={src}
            width="100%"
            height={height || '400px'}
            style={{ border: 0, borderRadius: '12px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    );
  }

  // ── Waze ──
  if (mapType === 'waze') {
    const wazeUrl = parseWaze(embedUrl);

    if (!wazeUrl) {
      return (
        <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <Navigation size={40} color="#9ca3af" strokeWidth={1.5} />
          </div>
          <p style={{ color: '#999', fontSize: '14px' }}>Pega el link de Waze en las propiedades</p>
        </div>
      );
    }

    return (
      <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
        {title && <h3 style={{ marginBottom: '12px', fontSize: '24px', color, fontWeight: '700' }}>{title}</h3>}
        {address && (
          <p style={{ marginBottom: '20px', color: `${color}88`, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <MapPin size={14} /> {address}
          </p>
        )}
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '16px 32px', borderRadius: '50px',
            background: '#33ccff', color: '#fff',
            textDecoration: 'none', fontSize: '16px', fontWeight: '700',
            boxShadow: '0 8px 25px rgba(51,204,255,0.35)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Navigation size={20} /> Abrir en Waze
        </a>
      </div>
    );
  }

  return null;
}
