'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Mail, Calendar, MapPin, Heart, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAppSettings } from '@/components/layout/AppBranding';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { getSectionComponent } from '@/app/dashboard/builder/[id]/section-types';
import { getSectionBgStyle } from '@/app/dashboard/builder/[id]/utils/bgStyles';
import EnvelopeAnimation from './EnvelopeAnimation';
import CardAnimation from './CardAnimation';

/* ── Intersection Observer hook for scroll animations ── */
function useIntersectionObserver(ref, options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, ...options });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return isVisible;
}

/* ── Animated section wrapper ── */
function AnimatedSection({ children, animation = 'fade-up', delay = 0, className = '', style = {}, ...props }) {
  const ref = useRef(null);
  const isVisible = useIntersectionObserver(ref);

  const animClass = animation === 'none' ? '' : `anim-${animation}`;

  return (
    <div
      ref={ref}
      className={`animate-section ${isVisible ? 'is-visible' : ''} ${animClass} ${className}`}
      style={{ transitionDelay: `${delay}ms`, animationDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export default function PublicInvitationPage() {
  const { slug } = useParams();
  const appSettings = useAppSettings();
  const [invitation,    setInvitation]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [notFound,      setNotFound]      = useState(false);
  const [rsvpForm,      setRsvpForm]      = useState({ guest_id: '', response: '', message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [showRsvp,      setShowRsvp]      = useState(false);
  const [showOpening,   setShowOpening]   = useState(true);
  const [theme,         setTheme]         = useState({ primary: '#FF4D8F', fontFamily: 'Inter', animation: 'fade-up' });

  const { sections, themeData } = useMemo(() => {
    if (!invitation?.builder_json) return { sections: [], themeData: {} };
    try {
      const parsed = JSON.parse(invitation.builder_json);
      return { sections: (parsed.sections || []).sort((a, b) => a.order - b.order), themeData: parsed.theme || {} };
    } catch { return { sections: [], themeData: {} }; }
  }, [invitation]);

  const containerRef = useRef(null);
  const [canvasH, setCanvasH] = useState(800);

  useEffect(() => {
    if (themeData.canvasMode !== 'free') return;
    const el = containerRef.current;
    if (!el) return;
    
    const updateHeight = () => {
       let maxY = 300;
       const children = Array.from(el.children);
       children.forEach(c => {
           const bottom = c.offsetTop + c.offsetHeight;
           if (bottom > maxY) maxY = bottom;
       });
       setCanvasH(maxY + 60); // Padding
    };
    
    const obs = new ResizeObserver(updateHeight);
    Array.from(el.children).forEach(c => obs.observe(c));
    updateHeight(); // initial run
    
    return () => obs.disconnect();
  }, [sections, themeData.canvasMode]);

  useEffect(() => {
    api.get(`/invitations/public/${slug}`)
      .then(({ data }) => {
        const inv = data.data;
        setInvitation(inv);
        // Extract theme from builder_json
        if (inv.builder_json) {
          try {
            const parsed = JSON.parse(inv.builder_json);
            if (parsed.theme) setTheme(t => ({ ...t, ...parsed.theme }));
          } catch {}
        }
        api.post('/analytics/view', { invitation_id: inv.id }).catch(() => {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Load Google Fonts dynamically (Global + Per Module)
  useEffect(() => {
    if (!invitation?.builder_json) return;
    try {
      const parsed = JSON.parse(invitation.builder_json);
      const fontsToLoad = new Set();
      if (parsed.theme?.fontFamily) fontsToLoad.add(parsed.theme.fontFamily);
      (parsed.sections || []).forEach(s => {
        if (s.props?.titleFont) fontsToLoad.add(s.props.titleFont);
        if (s.props?.textFont) fontsToLoad.add(s.props.textFont);
      });

      if (fontsToLoad.size === 0) return;

      const fontLinks = [];
      fontsToLoad.forEach(font => {
        const fontName = encodeURIComponent(font);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css?family=${fontName}:300,400,500,600,700&display=swap`;
        document.head.appendChild(link);
        fontLinks.push(link);
      });

      return () => fontLinks.forEach(link => document.head.removeChild(link));
    } catch {}
  }, [invitation]);

  const handleRSVPClick = () => {
    setShowRsvp(true);
  };

  const handleRsvp = async (e) => {
    e.preventDefault();
    if (!rsvpForm.guest_id || !rsvpForm.response) {
      toast({ variant: 'destructive', title: 'Completa todos los campos' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/guests/rsvp/${rsvpForm.guest_id}`, { response: rsvpForm.response, message: rsvpForm.message });
      setRsvpSubmitted(true);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'No se pudo enviar' });
    } finally { setSubmitting(false); }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', margin: '0 auto 16px', borderRadius: '50%', border: '3px solid rgba(255,77,143,0.3)', borderTop: '3px solid #FF4D8F', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Cargando tu invitación...</p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Mail className="w-20 h-20 text-pink-400 mx-auto mb-6" style={{ strokeWidth: 1.5 }} />
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>
            No encontramos esta invitación
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
            El enlace puede haber expirado o no ser válido.
          </p>
        </div>
      </div>
    );
  }



  const fontFamily = themeData.fontFamily ? `"${themeData.fontFamily}", serif` : '"Inter", sans-serif';
  const animation  = themeData.animation || 'fade-up';
  const hasRSVP    = sections.some(s => s.type === 'rsvp' && s.props?.enabled !== false);
  const rsvpSection = sections.find(s => s.type === 'rsvp');
  const rsvpProps   = rsvpSection?.props || {};

  // Body background from theme
  const bodyBg = (() => {
    const t = themeData.bodyBgType;
    if (t === 'color' && themeData.bodyBgColor) return themeData.bodyBgColor;
    if (t === 'gradient' && themeData.bodyBgGradient) return themeData.bodyBgGradient;
    if (t === 'image' && themeData.bodyBgImage) return `url(${themeData.bodyBgImage}) center/cover fixed no-repeat`;
    return themeData.background || '#fff';
  })();

  const openingType = themeData.openingAnimation || 'none';

  return (
    <div style={{ minHeight: '100vh', background: bodyBg, fontFamily }}>

      {/* Opening animation overlay */}
      {showOpening && openingType === 'envelope' && (
        <EnvelopeAnimation theme={themeData} onOpen={() => setShowOpening(false)} />
      )}
      {showOpening && openingType === 'card' && (
        <CardAnimation theme={themeData} onOpen={() => setShowOpening(false)} />
      )}

      {/* ── Builder sections with animations ── */}
      {sections.length > 0 ? (
        themeData.canvasMode === 'free' ? (
          // --- FREE CANVAS MODE ---
          <div style={{ width: '100vw', overflowX: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '390px', // Matches the exact width of the FreeCanvas builder
                height: `${canvasH}px`,
                maxWidth: '100%',
                margin: '0 auto',
                flexShrink: 0
              }}
            >
              {[...sections]
                .sort((a, b) => (a.props?.zIndex ?? 1) - (b.props?.zIndex ?? 1))
                .map((section, index) => {
                  const SectionComponent = getSectionComponent(section.type);
                  if (!SectionComponent) return null;
                  return (
                    <AnimatedSection
                      key={section.id}
                      animation={animation}
                      delay={Math.min(index * 100, 400)}
                      className="section-typography-wrapper"
                      style={{
                        '--title-font': section.props?.titleFont ? `"${section.props.titleFont}", serif` : 'inherit',
                        '--text-font': section.props?.textFont ? `"${section.props.textFont}", sans-serif` : 'inherit',
                        position: 'absolute',
                        left: `${section.props?.x ?? 0}px`,
                        top: `${section.props?.y ?? 0}px`,
                        width: section.props?.layerW === 'auto' ? 'auto' : `${section.props?.layerW ?? 390}px`,
                        height: section.props?.layerH === 'auto' ? 'auto' : `${section.props?.layerH}px`,
                        zIndex: section.props?.zIndex ?? 1,
                        display: section.props?.layerHidden ? 'none' : 'block'
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        {(() => { const bg = getSectionBgStyle(section.props); return bg ? <div style={bg} /> : null; })()}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          {section.type === 'rsvp' ? (
                            <SectionComponent props={section.props} onRSVPClick={handleRSVPClick} />
                          ) : section.type === 'photo_upload' ? (
                            <SectionComponent props={section.props} invitationId={invitation.id} />
                          ) : (
                            <SectionComponent props={section.props} />
                          )}
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
            </div>
          </div>
        ) : (
          // --- STACK MODE ---
          <div>
            {sections.map((section, index) => {
              const SectionComponent = getSectionComponent(section.type);
              if (!SectionComponent) return null;

              return (
                <AnimatedSection
                  key={section.id}
                  animation={animation}
                  delay={Math.min(index * 100, 400)}
                >
                  <div 
                    className="section-typography-wrapper"
                    style={{ 
                      position: 'relative',
                      '--title-font': section.props?.titleFont ? `"${section.props.titleFont}", serif` : 'inherit',
                      '--text-font': section.props?.textFont ? `"${section.props.textFont}", sans-serif` : 'inherit'
                    }}
                  >
                    {(() => { const bg = getSectionBgStyle(section.props); return bg ? <div style={bg} /> : null; })()}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      {section.type === 'rsvp' ? (
                        <SectionComponent props={section.props} onRSVPClick={handleRSVPClick} />
                      ) : section.type === 'photo_upload' ? (
                        <SectionComponent props={section.props} invitationId={invitation.id} />
                      ) : (
                        <SectionComponent props={section.props} />
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )
      ) : (
        /* Elegant fallback */
        <div style={{
          minHeight: '100vh',
          background: themeData.background || `linear-gradient(160deg, #1a1a2e, #16213e)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
        }}>
          <div style={{ marginBottom: '28px' }}>
            <Mail className="w-20 h-20 text-pink-400 mx-auto animate-pulse" style={{ strokeWidth: 1.5 }} />
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '700', color: '#fff', margin: '0 0 16px', lineHeight: 1.1, fontFamily }}>
            {invitation.title}
          </h1>
          {invitation.event_name && (
            <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)', margin: '0 0 36px' }}>
              {invitation.event_name}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            {invitation.event_date && (
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar className="w-5 h-5" /> {formatDateTime(invitation.event_date)}
              </p>
            )}
            {invitation.event_location && (
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin className="w-5 h-5" /> {invitation.event_location}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── RSVP Modal Popup ── */}
      {showRsvp && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0',
          }}
          onClick={() => { if (!rsvpSubmitted) setShowRsvp(false); }}
        >
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} />

          {/* Modal card — bottom sheet on mobile, centered on desktop */}
          <style>{`
            @keyframes rsvpSlideUp {
              0%  { opacity:0; transform: translateY(60px); }
              100%{ opacity:1; transform: translateY(0); }
            }
            @keyframes rsvpFadeIn {
              0%  { opacity:0; transform: scale(0.96) translateY(20px); }
              100%{ opacity:1; transform: scale(1) translateY(0); }
            }
            @media (min-width: 640px) {
              .rsvp-modal-card {
                animation: rsvpFadeIn 0.32s cubic-bezier(.4,0,.2,1) !important;
                border-radius: 24px !important;
                max-height: 90vh !important;
                margin-bottom: 0 !important;
                align-self: center !important;
              }
            }
          `}</style>

          <div
            className="rsvp-modal-card"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              background: rsvpProps.popupBgColor || '#ffffff',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -8px 60px rgba(0,0,0,0.18)',
              overflowY: 'auto',
              maxHeight: '92vh',
              animation: 'rsvpSlideUp 0.35s cubic-bezier(.4,0,.2,1)',
              marginBottom: '0',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div style={{
              width: '40px', height: '4px', borderRadius: '2px',
              background: 'rgba(0,0,0,0.12)',
              margin: '12px auto 0',
            }} />

            {/* Close button */}
            <button
              onClick={() => setShowRsvp(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 2,
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', color: '#6b7280', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}
            >
              ✕
            </button>

            {!rsvpSubmitted ? (
              <>
                {/* Header */}
                <div style={{ padding: '20px 24px 16px', textAlign: 'center' }}>
                  {/* Accent bar */}
                  <div style={{
                    width: '44px', height: '3px', borderRadius: '2px',
                    background: rsvpProps.popupAccentColor || themeData.primary || '#7c3aed',
                    margin: '0 auto 18px',
                  }} />
                  <h2 style={{
                    fontSize: 'clamp(20px, 5vw, 26px)',
                    fontWeight: '700', margin: '0 0 6px',
                    color: '#111827', fontFamily,
                    lineHeight: 1.2,
                  }}>
                    {rsvpProps.popupTitle || 'Confirma tu asistencia'}
                  </h2>
                  <p style={{
                    color: '#9ca3af', fontSize: 'clamp(13px, 3.5vw, 15px)',
                    margin: 0, lineHeight: '1.5',
                  }}>
                    {rsvpProps.popupSubtitle || 'Tu presencia hace el día especial'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleRsvp} style={{
                  padding: '0 clamp(16px, 5vw, 28px) clamp(24px, 5vw, 32px)',
                  display: 'flex', flexDirection: 'column', gap: '18px',
                }}>
                  {/* Guest ID */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '13px', fontWeight: '600',
                      color: '#374151', marginBottom: '7px',
                    }}>
                      Tu ID de invitado
                    </label>
                    <input
                      value={rsvpForm.guest_id}
                      onChange={e => setRsvpForm({ ...rsvpForm, guest_id: e.target.value })}
                      placeholder="Ingresa tu código..."
                      style={{
                        width: '100%', padding: '13px 15px',
                        border: '1.5px solid #e5e7eb', borderRadius: '12px',
                        fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                        background: '#f9fafb', transition: 'border-color 0.2s, box-shadow 0.2s',
                        fontFamily,
                      }}
                      onFocus={e => {
                        const ac = rsvpProps.popupAccentColor || themeData.primary || '#7c3aed';
                        e.target.style.borderColor = ac;
                        e.target.style.boxShadow = `0 0 0 3px ${ac}18`;
                        e.target.style.background = '#fff';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = '#f9fafb';
                      }}
                    />
                  </div>

                  {/* Response buttons */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '13px', fontWeight: '600',
                      color: '#374151', marginBottom: '10px',
                    }}>
                      Tu respuesta
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {[
                        { v: 'confirmed', icon: '✓', l: 'Asistiré',  c: '#22c55e' },
                        { v: 'declined',  icon: '✕', l: 'No puedo',  c: '#ef4444' },
                        { v: 'maybe',     icon: '?', l: 'Tal vez',   c: '#f59e0b' },
                      ].map(({ v, icon, l, c }) => {
                        const selected = rsvpForm.response === v;
                        return (
                          <button
                            key={v} type="button"
                            onClick={() => setRsvpForm({ ...rsvpForm, response: v })}
                            style={{
                              padding: 'clamp(12px, 3vw, 16px) 8px',
                              borderRadius: '14px', cursor: 'pointer',
                              border: `2px solid ${selected ? c : '#e5e7eb'}`,
                              background: selected ? `${c}12` : '#fafafa',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', gap: '6px',
                              transition: 'all 0.2s',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <span style={{
                              width: 'clamp(32px, 8vw, 40px)',
                              height: 'clamp(32px, 8vw, 40px)',
                              borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: '700',
                              background: selected ? c : '#e5e7eb',
                              color: selected ? '#fff' : '#9ca3af',
                              transition: 'all 0.2s',
                            }}>
                              {icon}
                            </span>
                            <span style={{
                              fontSize: 'clamp(11px, 2.8vw, 13px)',
                              fontWeight: '600',
                              color: selected ? c : '#6b7280',
                            }}>
                              {l}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '13px', fontWeight: '600',
                      color: '#374151', marginBottom: '7px',
                    }}>
                      Mensaje{' '}
                      <span style={{ fontWeight: '400', color: '#9ca3af' }}>(opcional)</span>
                    </label>
                    <textarea
                      value={rsvpForm.message}
                      onChange={e => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                      placeholder="Escribe un mensaje especial..."
                      rows={3}
                      style={{
                        width: '100%', padding: '13px 15px',
                        border: '1.5px solid #e5e7eb', borderRadius: '12px',
                        fontSize: '15px', outline: 'none', resize: 'none',
                        boxSizing: 'border-box', background: '#f9fafb',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        fontFamily,
                      }}
                      onFocus={e => {
                        const ac = rsvpProps.popupAccentColor || themeData.primary || '#7c3aed';
                        e.target.style.borderColor = ac;
                        e.target.style.boxShadow = `0 0 0 3px ${ac}18`;
                        e.target.style.background = '#fff';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = '#f9fafb';
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting || !rsvpForm.response}
                    style={{
                      padding: 'clamp(14px, 3.5vw, 17px)',
                      borderRadius: '14px', border: 'none',
                      background: !rsvpForm.response
                        ? '#e5e7eb'
                        : (rsvpProps.popupAccentColor || themeData.primary || '#7c3aed'),
                      color: !rsvpForm.response ? '#9ca3af' : '#fff',
                      fontSize: 'clamp(14px, 3.5vw, 16px)',
                      fontWeight: '700',
                      cursor: submitting || !rsvpForm.response ? 'not-allowed' : 'pointer',
                      fontFamily,
                      transition: 'all 0.2s',
                      boxShadow: rsvpForm.response
                        ? `0 6px 24px ${(rsvpProps.popupAccentColor || themeData.primary || '#7c3aed')}40`
                        : 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {submitting ? 'Enviando...' : 'Enviar confirmación'}
                  </button>
                </form>
              </>
            ) : (
              /* Success state */
              <div style={{ padding: 'clamp(40px, 10vw, 56px) clamp(24px, 6vw, 40px)', textAlign: 'center' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: rsvpForm.response === 'confirmed' ? '#22c55e15'
                    : rsvpForm.response === 'declined' ? '#ef444415' : '#f59e0b15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <span style={{
                    fontSize: '32px', fontWeight: '700',
                    color: rsvpForm.response === 'confirmed' ? '#22c55e'
                      : rsvpForm.response === 'declined' ? '#ef4444' : '#f59e0b',
                  }}>
                    {rsvpForm.response === 'confirmed' ? '✓' : rsvpForm.response === 'declined' ? '✕' : '?'}
                  </span>
                </div>
                <h2 style={{
                  fontSize: 'clamp(20px, 5vw, 24px)',
                  fontWeight: '700', color: '#111827',
                  marginBottom: '10px', fontFamily,
                }}>
                  {rsvpProps.successTitle || '¡Gracias por confirmar!'}
                </h2>
                <p style={{
                  color: '#6b7280', fontSize: 'clamp(13px, 3.5vw, 15px)',
                  lineHeight: '1.6', margin: '0 0 20px',
                }}>
                  {rsvpProps.successMessage || 'Tu respuesta ha sido registrada con éxito.'}
                </p>
                {rsvpForm.response === 'confirmed' && (
                  <p style={{ color: '#22c55e', fontWeight: '600', fontSize: '16px', margin: '0 0 24px' }}>
                    {rsvpProps.successConfirmedText || '¡Te esperamos con mucha ilusión!'}
                  </p>
                )}
                <button
                  onClick={() => setShowRsvp(false)}
                  style={{
                    padding: '12px 36px', borderRadius: '12px',
                    border: '1.5px solid #e5e7eb', background: '#fff',
                    color: '#374151', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', fontFamily, transition: 'all 0.2s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Footer — branding */}
      {appSettings.show_branding !== 0 && (
        <div style={{ textAlign: 'center', padding: '20px 20px 28px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily }}>
            {/* Mini logo */}
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: '#7c3aed', display: 'flex',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
            }}>
              {appSettings.logo_url
                ? <img src={appSettings.logo_url} alt={appSettings.app_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Sparkles style={{ width: 12, height: 12, color: '#fff' }} />
              }
            </div>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>
              {appSettings.footer_text || `Hecha con ♥ por ${appSettings.app_name}`}
            </span>
            {appSettings.app_url && (
              <a
                href={appSettings.app_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: themeData?.primary || '#7c3aed', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}
              >
                {appSettings.app_url.replace(/https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
