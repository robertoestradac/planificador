import { Shirt, UserRound, Sparkles, Wine, Crown, Palmtree, Drama } from 'lucide-react';
import DynamicIcon from '../components/DynamicIcon';

const ATTIRE_ICONS = {
  'Formal': 'UserRound',
  'Semi-formal': 'Shirt',
  'Casual elegante': 'Shirt',
  'Casual': 'Shirt',
  'Cocktail': 'Wine',
  'Black Tie': 'Crown',
  'Playa': 'Palmtree',
  'Fantasía': 'Drama',
};

export default function DressCodeSection({ props }) {
  const { title, subtitle, attire, colors, note, textColor, paddingY, attireIcon } = props;
  const color = textColor || '#1a1a1a';

  const colorList = Array.isArray(colors) ? colors : (typeof colors === 'string' ? colors.split(',').map(c => c.trim()).filter(Boolean) : []);

  const isImageUrl = (v) => v && (v.startsWith('http') || v.startsWith('/') || v.startsWith('data:'));
  const iconValue  = attireIcon || ATTIRE_ICONS[attire] || 'Shirt';
  const useImage   = isImageUrl(attireIcon);

  return (
    <div style={{ padding: `${paddingY || '60px'} 20px`, textAlign: 'center' }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: '36px' }}>
          {title && <h2 style={{ fontSize: '32px', fontWeight: '700', color, margin: '0 0 8px' }}>{title}</h2>}
          {subtitle && <p style={{ color: `${color}88`, fontSize: '16px', margin: 0 }}>{subtitle}</p>}
        </div>
      )}

      {/* Tipo de vestimenta */}
      {attire && (
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: 'rgba(255,255,255,0.7)', borderRadius: '20px',
          padding: '24px 40px', marginBottom: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.9)',
        }}>
          <div style={{ marginBottom: '8px' }}>
            {useImage
              ? <img src={attireIcon} alt={attire} style={{ width: 48, height: 48, objectFit: 'contain' }} />
              : <DynamicIcon name={iconValue} size={48} color={color} strokeWidth={1.5} />
            }
          </div>
          <span style={{ fontSize: '22px', fontWeight: '700', color }}>{attire}</span>
        </div>
      )}

      {/* Paleta de colores */}
      {colorList.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: `${color}88`, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Paleta de colores
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {colorList.map((hex, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: hex, margin: '0 auto 4px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                  border: '3px solid #fff',
                }} />
                <span style={{ fontSize: '10px', color: `${color}66`, fontFamily: 'monospace' }}>{hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota */}
      {note && (
        <p style={{
          fontSize: '14px', color: `${color}88`, fontStyle: 'italic',
          maxWidth: '500px', margin: '0 auto',
          lineHeight: '1.7',
          background: 'rgba(255,255,255,0.5)',
          padding: '16px 24px', borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Sparkles size={16} style={{ flexShrink: 0 }} /> {note}
        </p>
      )}
    </div>
  );
}
