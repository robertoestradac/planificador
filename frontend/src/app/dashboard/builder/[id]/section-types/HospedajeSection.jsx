import { Building2, Star, MapPin, Car, Sparkles } from 'lucide-react';

export default function HospedajeSection({ props }) {
  const { title, subtitle, hotels, paddingY, textColor, accentColor } = props;
  const color  = textColor || '#1a1a2e';
  const accent = accentColor || '#7c3aed';
  const list   = Array.isArray(hotels) ? hotels : [];

  return (
    <div style={{ padding: `${paddingY || '60px'} 20px` }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <Building2 size={44} color={accent} strokeWidth={1.5} />
          </div>
          {title && <h2 style={{ fontSize: '28px', fontWeight: '700', color, margin: '0 0 8px' }}>{title}</h2>}
          {subtitle && <p style={{ color: `${color}88`, fontSize: '15px', margin: 0 }}>{subtitle}</p>}
        </div>

        {list.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Agrega opciones de hospedaje desde el panel</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {list.map((hotel, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: '20px', padding: '20px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                border: `1px solid rgba(0,0,0,0.06)`,
                display: 'flex', alignItems: 'flex-start', gap: '16px',
              }}>
                {/* Star rating */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: `${accent}15`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  {hotel.stars >= 4 ? <Star size={22} color={accent} fill={accent} /> : <Building2 size={22} color={accent} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color, margin: '0 0 4px' }}>
                      {hotel.name || 'Hotel'}
                    </h3>
                    {hotel.price && (
                      <span style={{ fontSize: '13px', fontWeight: '600', color: accent, background: `${accent}15`, padding: '2px 10px', borderRadius: '20px' }}>
                        {hotel.price}
                      </span>
                    )}
                  </div>
                  {hotel.address && (
                    <p style={{ color: `${color}66`, fontSize: '13px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} style={{ flexShrink: 0 }} /> {hotel.address}
                    </p>
                  )}
                  {hotel.distance && (
                    <p style={{ color: `${color}66`, fontSize: '12px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Car size={12} style={{ flexShrink: 0 }} /> A {hotel.distance} del lugar del evento
                    </p>
                  )}
                  {hotel.note && (
                    <p style={{ color: `${color}88`, fontSize: '13px', fontStyle: 'italic', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} style={{ flexShrink: 0 }} /> {hotel.note}
                    </p>
                  )}
                  {hotel.bookingUrl && (
                    <a
                      href={hotel.bookingUrl}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', fontWeight: '600', color: accent,
                        textDecoration: 'none',
                        background: `${accent}10`, padding: '6px 14px', borderRadius: '20px',
                        transition: 'background 0.2s',
                      }}
                    >
                      Reservar →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
