export default function QuoteSection({ props }) {
  const { text, author, textColor, accentColor, paddingY, fontSize } = props;
  const color  = textColor || '#ffffff';
  const accent = accentColor || '#f9a8d4';
  const size   = fontSize || '28px';

  return (
    <div style={{ padding: `${paddingY || '80px'} 20px` }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        {/* Comillas decorativas */}
        <div style={{
          fontSize: '120px', lineHeight: '0.5',
          color: `${accent}20`, position: 'absolute',
          top: '-20px', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Georgia, serif', userSelect: 'none',
        }}>❝</div>

        <p style={{
          fontSize: size, fontStyle: 'italic', lineHeight: '1.7',
          color, margin: '0 0 24px', fontFamily: 'Georgia, "Times New Roman", serif',
          position: 'relative', zIndex: 1,
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>
          {text || 'Escribe aquí tu frase o poema favorito...'}
        </p>

        {author && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ height: '1px', width: '40px', background: accent }} />
            <span style={{ color: accent, fontSize: '16px', fontWeight: '500', letterSpacing: '1px' }}>
              {author}
            </span>
            <div style={{ height: '1px', width: '40px', background: accent }} />
          </div>
        )}
      </div>
    </div>
  );
}
