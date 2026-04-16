import { MapPin } from 'lucide-react';
import DynamicIcon from '../components/DynamicIcon';

export default function ScheduleSection({ props }) {
  const { title, subtitle, events, textColor, accentColor, paddingY } = props;
  const color  = textColor || '#1a1a1a';
  const accent = accentColor || '#7c3aed';
  const items  = events || [];

  return (
    <div style={{ padding: `${paddingY || '60px'} 20px` }}>
      {(title || subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {title && <h2 style={{ fontSize: '32px', fontWeight: '700', color, margin: '0 0 8px' }}>{title}</h2>}
          {subtitle && <p style={{ color: `${color}88`, fontSize: '16px', margin: 0 }}>{subtitle}</p>}
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af' }}>Agrega eventos al itinerario desde el panel</p>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          {/* Línea vertical */}
          <div style={{
            position: 'absolute', left: '120px', top: 0, bottom: 0,
            width: '2px', background: `${accent}33`,
          }} />

          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'flex-start' }}>
              {/* Tiempo */}
              <div style={{ width: '96px', textAlign: 'right', paddingTop: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: accent }}>{item.time || '00:00'}</span>
              </div>

              {/* Punto */}
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: accent, border: '3px solid transparent',
                boxShadow: `0 0 0 2px ${accent}`,
                marginTop: '6px', flexShrink: 0, position: 'relative', zIndex: 1,
              }} />

              {/* Contenido */}
              <div style={{ flex: 1, paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {item.icon && <DynamicIcon name={item.icon} size={20} color={accent} />}
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color, margin: 0 }}>{item.title || 'Evento'}</h3>
                </div>
                {item.location && (
                  <p style={{ color: `${color}66`, fontSize: '13px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} style={{ flexShrink: 0 }} /> {item.location}
                  </p>
                )}
                {item.description && (
                  <p style={{ color: `${color}88`, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
