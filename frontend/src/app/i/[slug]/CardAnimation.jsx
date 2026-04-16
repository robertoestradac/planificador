'use client';
import { useState } from 'react';

/**
 * Card flip opening animation.
 * A card that flips on click to reveal the invitation.
 */
export default function CardAnimation({ onOpen, theme = {} }) {
  const [phase, setPhase] = useState('closed'); // closed | flipping | done

  const cardColor  = theme.cardColor  || '#ffffff';
  const cardText   = theme.cardText   || 'Estás invitado...';
  const primary    = theme.primary    || '#FF4D8F';
  const fontFamily = theme.fontFamily ? `"${theme.fontFamily}", serif` : '"Playfair Display", serif';

  const handleClick = () => {
    if (phase !== 'closed') return;
    setPhase('flipping');
    setTimeout(() => {
      setPhase('done');
      onOpen();
    }, 1400);
  };

  if (phase === 'done') return null;

  return (
    <>
      <style>{`
        @keyframes card-flip {
          0%   { transform: perspective(1200px) rotateY(0deg); }
          100% { transform: perspective(1200px) rotateY(180deg); }
        }
        @keyframes card-fade-out {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes card-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
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
          background: 'linear-gradient(135deg, #f8f6f3 0%, #ece8e1 100%)',
          cursor: 'pointer',
          fontFamily,
          animation: phase === 'flipping' ? 'card-fade-out 0.5s ease-in 0.9s forwards' : undefined,
        }}
      >
        {/* Card */}
        <div
          style={{
            width: '280px',
            height: '400px',
            borderRadius: '16px',
            background: cardColor,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 30px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            transformStyle: 'preserve-3d',
            animation: phase === 'flipping'
              ? 'card-flip 0.8s ease-in forwards'
              : 'card-float 4s ease-in-out infinite',
          }}
        >
          {/* Decorative border */}
          <div style={{
            position: 'absolute',
            inset: '8px',
            border: `1px solid ${primary}30`,
            borderRadius: '12px',
            pointerEvents: 'none',
          }} />

          {/* Decorative top ornament */}
          <div style={{
            width: '60px',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${primary}60, transparent)`,
            marginBottom: '24px',
          }} />

          {/* Icon */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px', opacity: 0.7 }}>
            <path d="M20 12V22H4V12" />
            <path d="M22 7H2V12H22V7Z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" />
            <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" />
          </svg>

          {/* Main text */}
          <p style={{
            fontSize: '28px',
            fontWeight: '400',
            color: '#333',
            lineHeight: '1.4',
            margin: '0 0 16px',
            fontStyle: 'italic',
          }}>
            {cardText}
          </p>

          {/* Decorative bottom ornament */}
          <div style={{
            width: '60px',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${primary}60, transparent)`,
            marginTop: '8px',
          }} />

          {/* CTA hint */}
          <p style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#999',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: '32px',
          }}>
            Toca para abrir
          </p>
        </div>
      </div>
    </>
  );
}
