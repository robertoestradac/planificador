import { Gift, Landmark, ShoppingBag } from 'lucide-react';

export default function GiftsSection({ props }) {
  const { title, subtitle, message, banks, wishlistUrl, textColor, accentColor, paddingY } = props;
  const color  = textColor || '#1a1a1a';
  const accent = accentColor || '#7c3aed';
  const bankList = Array.isArray(banks) ? banks : [];

  return (
    <div style={{ padding: `${paddingY || '60px'} 20px` }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
        {/* Icono decorativo */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <Gift size={56} color={accent} strokeWidth={1.5} />
        </div>

        {title && <h2 style={{ fontSize: '32px', fontWeight: '700', color, margin: '0 0 8px' }}>{title}</h2>}
        {subtitle && <p style={{ color: `${color}88`, fontSize: '16px', margin: '0 0 24px' }}>{subtitle}</p>}

        {message && (
          <p style={{
            fontSize: '16px', color: `${color}bb`, lineHeight: '1.8',
            background: `${accent}0a`, borderRadius: '16px',
            padding: '20px 28px', marginBottom: '32px',
            border: `1px solid ${accent}20`,
            fontStyle: 'italic',
          }}>
            {message}
          </p>
        )}

        {/* Cuentas bancarias */}
        {bankList.length > 0 && (
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: `${color}66`, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', textAlign: 'center' }}>
              Transferencia bancaria
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {bankList.map((bank, i) => (
                <div key={i} style={{
                  background: `${accent}08`,
                  borderRadius: '16px', padding: '20px 24px',
                  border: `1px solid ${accent}20`,
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: accent, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}><Landmark size={20} color="#fff" /></div>
                  <div style={{ flex: 1 }}>
                    {bank.bank && <p style={{ fontWeight: '700', color, margin: '0 0 2px', fontSize: '16px' }}>{bank.bank}</p>}
                    {bank.name && <p style={{ color: `${color}88`, fontSize: '13px', margin: '0 0 2px' }}>A nombre de: {bank.name}</p>}
                    {bank.account && <p style={{ fontFamily: 'monospace', fontSize: '15px', color: accent, margin: 0, fontWeight: '600' }}>{bank.account}</p>}
                    {bank.type && <p style={{ color: `${color}66`, fontSize: '12px', margin: '2px 0 0' }}>{bank.type}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wishlist externa */}
        {wishlistUrl && (
          <a
            href={wishlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '50px',
              background: accent, color: '#fff',
              textDecoration: 'none', fontSize: '16px', fontWeight: '600',
              boxShadow: `0 8px 25px ${accent}40`,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <ShoppingBag size={18} /> Ver lista de regalos
          </a>
        )}
      </div>
    </div>
  );
}
