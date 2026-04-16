export default function RSVPSection({ props, onRSVPClick }) {
  const {
    title, subtitle, buttonText, buttonColor, buttonTextColor,
    textColor, accentColor, textAlign, enabled, paddingY,
  } = props;

  if (enabled === false) return null;

  const btnBg  = buttonColor  || '#7c3aed';
  const btnTxt = buttonTextColor || '#fff';
  const color  = textColor    || '#1a1a1a';
  const accent = accentColor  || btnBg;

  return (
    <div style={{
      padding: `${paddingY || '60px'} clamp(16px, 5vw, 40px)`,
      textAlign: textAlign || 'center',
    }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Envelope icon with glow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '72px', height: '72px', borderRadius: '50%',
          background: `${accent}15`,
          marginBottom: '24px',
          boxShadow: `0 0 0 12px ${accent}08`,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            <circle cx="18" cy="18" r="4" fill={accent} stroke="none" opacity="0.9" />
            <path d="M18 16v2l1 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Decorative divider */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', marginBottom: '20px',
        }}>
          <div style={{ flex: 1, maxWidth: '48px', height: '1px', background: `${accent}30` }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: `${accent}60` }} />
          <div style={{ flex: 1, maxWidth: '48px', height: '1px', background: `${accent}30` }} />
        </div>

        {title && (
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 32px)',
            fontWeight: '700',
            color,
            margin: '0 0 12px',
            lineHeight: 1.2,
            letterSpacing: '-0.3px',
          }}>
            {title}
          </h2>
        )}

        {subtitle && (
          <p style={{
            color: `${color}80`,
            fontSize: 'clamp(14px, 3.5vw, 17px)',
            margin: '0 0 36px',
            lineHeight: '1.65',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {subtitle}
          </p>
        )}

        <button
          onClick={onRSVPClick}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            backgroundColor: btnBg,
            color: btnTxt,
            padding: 'clamp(13px, 3vw, 17px) clamp(28px, 8vw, 52px)',
            borderRadius: '50px',
            border: 'none',
            fontSize: 'clamp(14px, 3.5vw, 17px)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
            boxShadow: `0 8px 32px ${btnBg}45`,
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.boxShadow = `0 16px 44px ${btnBg}55`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = `0 8px 32px ${btnBg}45`;
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            <path d="M18 15.28c.37-.36.86-.28 1.18 0l2.07 2.07a.84.84 0 0 1 0 1.18L18 21.78c-.37.36-.86.28-1.18 0" />
          </svg>
          {buttonText || 'Confirmar Asistencia'}
        </button>

        {/* Subtle note */}
        <p style={{
          marginTop: '16px',
          fontSize: '12px',
          color: `${color}45`,
          letterSpacing: '0.2px',
        }}>
          Solo toma un momento
        </p>
      </div>
    </div>
  );
}
