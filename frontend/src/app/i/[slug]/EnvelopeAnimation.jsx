'use client';
import { useState } from 'react';

/**
 * Envelope opening animation — inspired by specially.love
 * Full-screen envelope that opens on click to reveal invitation content.
 */
export default function EnvelopeAnimation({ onOpen, theme = {} }) {
  const [phase, setPhase] = useState('closed'); // closed | opening | done

  const envColor   = theme.envelopeColor || '#f5f0e8';
  const sealColor  = theme.sealColor     || '#C5A55A';
  const text       = theme.envelopeText  || 'Tenemos una noticia...';
  const cta        = theme.envelopeCTA   || '¡PULSA AQUÍ Y DESLIZA!';
  const fontFamily = theme.fontFamily    ? `"${theme.fontFamily}", serif` : '"Playfair Display", serif';

  // Slightly darker shade for flap shadows
  const flapShadow = 'rgba(0,0,0,0.08)';

  const handleClick = () => {
    if (phase !== 'closed') return;
    setPhase('opening');
    setTimeout(() => {
      setPhase('done');
      onOpen();
    }, 1200);
  };

  if (phase === 'done') return null;

  return (
    <>
      <style>{`
        @keyframes env-flap-open {
          0%   { transform: rotateX(0deg); }
          100% { transform: rotateX(-180deg); }
        }
        @keyframes env-slide-down {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes env-seal-break {
          0%   { transform: scale(1); opacity: 1; }
          40%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes env-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
        @keyframes env-bounce-arrow {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>

      <div
        onClick={handleClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9f7f4',
          cursor: 'pointer',
          fontFamily,
          animation: phase === 'opening' ? 'env-slide-down 0.8s ease-in 0.4s forwards' : undefined,
        }}
      >
        {/* Envelope container */}
        <div
          style={{
            position: 'relative',
            width: '320px',
            height: '220px',
            animation: phase === 'closed' ? 'env-pulse 3s ease-in-out infinite' : undefined,
          }}
        >
          {/* Envelope body */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '160px',
            background: envColor,
            borderRadius: '4px 4px 12px 12px',
            boxShadow: `0 8px 40px ${flapShadow}, 0 2px 8px ${flapShadow}`,
            zIndex: 2,
          }} />

          {/* Bottom flap (V shape) */}
          <div style={{
            position: 'absolute',
            bottom: '60px',
            left: '0',
            width: 0,
            height: 0,
            borderLeft: '160px solid transparent',
            borderRight: '160px solid transparent',
            borderBottom: `100px solid ${envColor}`,
            zIndex: 3,
            filter: 'brightness(0.97)',
          }} />

          {/* Left side flap */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 0,
            height: 0,
            borderTop: '80px solid transparent',
            borderBottom: '80px solid transparent',
            borderLeft: `160px solid ${envColor}`,
            zIndex: 1,
            filter: 'brightness(0.95)',
          }} />

          {/* Right side flap */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            borderTop: '80px solid transparent',
            borderBottom: '80px solid transparent',
            borderRight: `160px solid ${envColor}`,
            zIndex: 1,
            filter: 'brightness(0.95)',
          }} />

          {/* Top flap (opens) */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            width: 0,
            height: 0,
            borderLeft: '160px solid transparent',
            borderRight: '160px solid transparent',
            borderTop: `100px solid ${envColor}`,
            zIndex: phase === 'opening' ? 5 : 0,
            transformOrigin: 'top center',
            animation: phase === 'opening' ? 'env-flap-open 0.6s ease-in forwards' : undefined,
            filter: 'brightness(1.03)',
          }} />

          {/* Wax seal */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '100px',
            transform: 'translateX(-50%)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${sealColor}ee, ${sealColor}aa, ${sealColor}88)`,
            boxShadow: `0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)`,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: phase === 'opening' ? 'env-seal-break 0.5s ease-in forwards' : undefined,
          }}>
            {/* Leaf/branch icon inside seal */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 22V8M12 8C12 8 8 4 4 4c0 4 4 8 8 8zM12 8c0 0 4-4 8-4 0 4-4 8-8 8z" />
            </svg>
          </div>
        </div>

        {/* Text below envelope */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          {text && (
            <p style={{
              fontSize: '18px',
              color: '#6b6b6b',
              margin: '0 0 8px',
              fontStyle: 'italic',
            }}>
              {text}
            </p>
          )}
          <p style={{
            fontSize: '16px',
            fontWeight: '800',
            color: '#333',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            margin: 0,
            animation: 'env-bounce-arrow 2s ease-in-out infinite',
          }}>
            {cta}
          </p>
        </div>
      </div>
    </>
  );
}
