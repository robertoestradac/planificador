'use client';
import { useState, useEffect } from 'react';

export default function CountdownSection({ props }) {
  const { targetDate, title, textColor, labelColor, showDays, showHours, showMinutes, showSeconds, paddingY } = props;
  const lc = labelColor || '#888888';
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{ padding: `${paddingY || '40px'} 20px`, textAlign: 'center' }}>
      {title && <p style={{ color: textColor || '#7c3aed', fontSize: '14px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px' }}>{title}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {showDays && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '36px', fontWeight: 'bold', color: textColor || '#7c3aed' }}>{timeLeft.days}</span>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: lc }}>Días</span>
          </div>
        )}
        {showHours && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '36px', fontWeight: 'bold', color: textColor || '#7c3aed' }}>{timeLeft.hours}</span>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: lc }}>Hrs</span>
          </div>
        )}
        {showMinutes && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '36px', fontWeight: 'bold', color: textColor || '#7c3aed' }}>{timeLeft.minutes}</span>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: lc }}>Min</span>
          </div>
        )}
        {showSeconds && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '36px', fontWeight: 'bold', color: textColor || '#7c3aed' }}>{timeLeft.seconds}</span>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: lc }}>Seg</span>
          </div>
        )}
      </div>
    </div>
  );
}
