import { Heart } from 'lucide-react';
import DynamicIcon from '../components/DynamicIcon';

export default function CoupleSection({ props }) {
  const {
    person1Name, person1Photo, person1PhotoPos, person1PhotoFilter, person1Description,
    person2Name, person2Photo, person2PhotoPos, person2PhotoFilter, person2Description,
    title, subtitle, decoration, decorationIcon,
    textColor, paddingY,
  } = props;

  const color = textColor || '#1a1a1a';
  const iconName = decorationIcon || 'Heart';

  return (
    <div style={{ padding: `${paddingY || '60px'} 20px`, textAlign: 'center' }}>
      {title && (
        <h2 style={{ fontSize: '36px', fontWeight: '700', color, margin: '0 0 8px', fontStyle: 'italic' }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p style={{ color: `${color}99`, fontSize: '16px', margin: '0 0 48px' }}>{subtitle}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
        {/* Persona 1 */}
        <div style={{ flex: '1', minWidth: '200px', maxWidth: '280px' }}>
          {person1Photo ? (
            <img
              src={person1Photo}
              alt={person1Name}
              style={{
                width: '180px', height: '180px', borderRadius: '50%',
                objectFit: 'cover', objectPosition: person1PhotoPos || '50% 20%',
                margin: '0 auto 16px', display: 'block',
                border: '4px solid #fff',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                filter: person1PhotoFilter || undefined,
              }}
            />
          ) : (
            <div style={{
              width: '180px', height: '180px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #f9a8d4, #c084fc)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}><Heart size={64} color="#fff" strokeWidth={1.5} /></div>
          )}
          <h3 style={{ fontSize: '24px', fontWeight: '700', color, margin: '0 0 8px' }}>
            {person1Name || 'Nombre 1'}
          </h3>
          {person1Description && (
            <p style={{ color: `${color}88`, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {person1Description}
            </p>
          )}
        </div>

        {/* Decoración central */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DynamicIcon name={iconName} size={48} color="#ec4899" strokeWidth={1.5} />
        </div>

        {/* Persona 2 */}
        <div style={{ flex: '1', minWidth: '200px', maxWidth: '280px' }}>
          {person2Photo ? (
            <img
              src={person2Photo}
              alt={person2Name}
              style={{
                width: '180px', height: '180px', borderRadius: '50%',
                objectFit: 'cover', objectPosition: person2PhotoPos || '50% 20%',
                margin: '0 auto 16px', display: 'block',
                border: '4px solid #fff',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                filter: person2PhotoFilter || undefined,
              }}
            />
          ) : (
            <div style={{
              width: '180px', height: '180px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #93c5fd, #818cf8)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}><Heart size={64} color="#fff" strokeWidth={1.5} /></div>
          )}
          <h3 style={{ fontSize: '24px', fontWeight: '700', color, margin: '0 0 8px' }}>
            {person2Name || 'Nombre 2'}
          </h3>
          {person2Description && (
            <p style={{ color: `${color}88`, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {person2Description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
