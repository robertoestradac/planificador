import { UtensilsCrossed } from 'lucide-react';
import DynamicIcon from '../components/DynamicIcon';

export default function MenuEventSection({ props }) {
  const { title, subtitle, categories, footer, paddingY, textColor, accentColor } = props;
  const color  = textColor || '#1a1a2e';
  const accent = accentColor || '#D4AF37';
  const cats   = Array.isArray(categories) ? categories : [];

  return (
    <div style={{ padding: `${paddingY || '60px'} 20px` }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <UtensilsCrossed size={44} color={accent} strokeWidth={1.5} />
          </div>
          {title && <h2 style={{ fontSize: '30px', fontWeight: '700', color, margin: '0 0 8px', fontStyle: 'italic' }}>{title}</h2>}
          {subtitle && <p style={{ color: `${color}88`, fontSize: '15px', margin: 0 }}>{subtitle}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: `${accent}40` }} />
            <span style={{ color: accent, fontSize: '20px' }}>✦</span>
            <div style={{ flex: 1, height: '1px', background: `${accent}40` }} />
          </div>
        </div>

        {cats.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Agrega categorías del menú desde el panel</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {cats.map((cat, i) => (
              <div key={i}>
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  {cat.icon && <DynamicIcon name={cat.icon} size={20} color={accent} />}
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: accent, textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
                    {cat.name || 'Categoría'}
                  </h3>
                  <div style={{ flex: 1, height: '1px', background: `${accent}30` }} />
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(cat.items || []).map((item, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '600', color, margin: '0 0 2px' }}>{item.name}</p>
                        {item.description && (
                          <p style={{ fontSize: '13px', color: `${color}66`, margin: 0, fontStyle: 'italic' }}>{item.description}</p>
                        )}
                        {item.tags && (item.tags || '').split(',').filter(Boolean).map(tag => (
                          <span key={tag} style={{ display: 'inline-block', fontSize: '10px', background: `${accent}20`, color: accent, padding: '2px 8px', borderRadius: '8px', marginTop: '4px', marginRight: '4px', fontWeight: '600' }}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider + footer */}
        {footer && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '32px 0 16px' }}>
              <div style={{ flex: 1, height: '1px', background: `${accent}40` }} />
              <span style={{ color: accent, fontSize: '20px' }}>✦</span>
              <div style={{ flex: 1, height: '1px', background: `${accent}40` }} />
            </div>
            <p style={{ textAlign: 'center', color: `${color}66`, fontSize: '13px', fontStyle: 'italic' }}>{footer}</p>
          </>
        )}
      </div>
    </div>
  );
}
