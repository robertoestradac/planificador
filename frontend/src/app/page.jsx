'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Check, Sparkles, Mail, Users, BarChart3, Palette, Globe, Shield,
  ChevronLeft, ChevronRight, ArrowRight, Zap, Star, Lock, Menu, X,
  CheckCircle, Smartphone, Play, Plus, Minus, Send, Settings,
  Image as ImageIcon, Heart, Calendar, MapPin, Camera, Music,
  Layers, MousePointer, Eye, TrendingUp, Clock, Gift, Wand2,
  QrCode, Share2, Bell, ChevronDown
} from 'lucide-react';
import { useAppSettings } from '@/components/layout/AppBranding';
import { mergeLanding } from '@/lib/defaultLanding';
import api from '@/lib/api';

const ICON_MAP = {
  Palette, Globe, Users, BarChart3, Mail, Shield, Sparkles, Zap, Star, Lock,
  CheckCircle, Smartphone, Send, Settings, Heart, Calendar, MapPin, Camera,
  Music, Layers, MousePointer, Eye, TrendingUp, Clock, Gift, Wand2, QrCode,
  Share2, Bell, Check
};

/* ════════════════════════════════════════════
   HERO SECTION — Slider + Phone Mockup
   ════════════════════════════════════════════ */
function HeroSection({ hero, slideshow, appSettings }) {
  const [idx, setIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timer = useRef(null);
  const images = slideshow?.visible && slideshow?.images?.length > 0
    ? slideshow.images
    : (hero.bgImage ? [hero.bgImage] : []);

  const goTo = useCallback((newIdx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIdx(newIdx);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const next = useCallback(() => goTo((idx + 1) % Math.max(images.length, 1)), [idx, images.length, goTo]);
  const prev = useCallback(() => goTo((idx - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1)), [idx, images.length, goTo]);

  useEffect(() => {
    if (!slideshow?.autoplay || images.length < 2) return;
    timer.current = setInterval(next, slideshow.interval || 4500);
    return () => clearInterval(timer.current);
  }, [slideshow?.autoplay, slideshow?.interval, images.length, next]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text */}
          <div className="text-center lg:text-left">
            {hero.badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-violet-300 text-sm font-semibold mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                {hero.badge}
              </div>
            )}

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
              {hero.title}
              {hero.titleHighlight && (
                <span className="block mt-2 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-rose-400">
                  {hero.titleHighlight}
                </span>
              )}
            </h1>

            {hero.description && (
              <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {hero.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
              {hero.ctaPrimary && (
                <Link href="/login">
                  <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all duration-300 hover:-translate-y-0.5">
                    {hero.ctaPrimary}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              )}
              {hero.ctaSecondary && (
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
                  <Play className="w-4 h-4 fill-current" />
                  {hero.ctaSecondary}
                </button>
              )}
            </div>

            {hero.ctaNote && (
              <p className="text-sm text-gray-500 flex items-center justify-center lg:justify-start gap-2">
                <Check className="w-4 h-4 text-green-400" />
                {hero.ctaNote}
              </p>
            )}

            {/* Trust badges */}
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6">
              {[
                { icon: Shield, text: 'Seguro y privado' },
                { icon: Zap, text: 'Listo en minutos' },
                { icon: Smartphone, text: '100% responsive' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone Mockup with Slideshow */}
          <div className="relative flex items-center justify-center">
            {/* Glow behind phone */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 rounded-full bg-violet-600/30 blur-[80px]" />
            </div>

            {/* Floating cards */}
            <div className="absolute -left-4 top-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-xl hidden lg:flex items-center gap-3 animate-float">
              <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">Nueva confirmación</p>
                <p className="text-gray-400 text-xs">María García confirmó asistencia</p>
              </div>
            </div>

            <div className="absolute -right-4 bottom-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-xl hidden lg:flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
              <div className="w-8 h-8 rounded-full bg-violet-400/20 flex items-center justify-center">
                <Eye className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">247 vistas hoy</p>
                <p className="text-gray-400 text-xs">↑ 32% vs ayer</p>
              </div>
            </div>

            {/* Phone Frame */}
            <div className="relative z-10 w-[260px] sm:w-[290px]">
              <div className="relative bg-gray-900 border-[8px] border-gray-800 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden aspect-[9/19.5]">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 flex justify-center z-20 pt-1">
                  <div className="w-24 h-5 bg-gray-900 rounded-b-2xl" />
                </div>
                {/* Screen */}
                <div className="relative w-full h-full bg-gray-950">
                  {images.length > 0 ? (
                    images.map((src, i) => (
                      <img key={i} src={src} alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                        style={{ opacity: i === idx ? 1 : 0, transform: i === idx ? 'scale(1)' : 'scale(1.05)' }}
                      />
                    ))
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900 to-pink-900 flex flex-col items-center justify-center gap-4 p-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-pink-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">Ana & Carlos</p>
                        <p className="text-white/60 text-xs mt-1">Se casan el 15 de Diciembre</p>
                      </div>
                      <div className="w-full bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-white/80 text-xs">¿Confirmas tu asistencia?</p>
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 bg-violet-500 text-white text-xs py-1.5 rounded-lg font-bold">Sí, asistiré</button>
                          <button className="flex-1 bg-white/10 text-white/60 text-xs py-1.5 rounded-lg">No podré</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Slider controls */}
              {images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-20">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={next} className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-20">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => goTo(i)}
                        className={`rounded-full transition-all duration-300 ${i === idx ? 'w-6 h-2 bg-violet-400' : 'w-2 h-2 bg-white/30'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </section>
  );
}

/* ════════════════════════════════════════════
   STATS BAR
   ════════════════════════════════════════════ */
function StatsBar({ stats }) {
  if (stats?.visible === false || !stats?.items?.length) return null;
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {stats.items.map((s, i) => (
            <div key={i} className="py-8 px-6 text-center group hover:bg-violet-50/50 transition-colors">
              <p className="text-3xl sm:text-4xl font-black text-violet-600 tracking-tight group-hover:scale-110 transition-transform inline-block">{s.value}</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   LOGOS / SOCIAL PROOF BAR
   ════════════════════════════════════════════ */
function SocialProofBar() {
  const eventTypes = ['Bodas', 'XV Años', 'Baby Shower', 'Graduaciones', 'Corporativos', 'Cumpleaños', 'Bautizos'];
  return (
    <div className="bg-gray-50 border-b border-gray-100 py-5 overflow-hidden">
      <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Perfecto para todo tipo de eventos</p>
      <div className="flex gap-8 animate-marquee whitespace-nowrap">
        {[...eventTypes, ...eventTypes].map((type, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            {type}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   HOW IT WORKS — Steps
   ════════════════════════════════════════════ */
function StepsSection({ steps }) {
  if (steps.visible === false || !steps.items?.length) return null;
  return (
    <section className="py-28 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-widest mb-4">Cómo funciona</span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-5">{steps.title}</h2>
          {steps.subtitle && <p className="text-xl text-gray-500 max-w-2xl mx-auto">{steps.subtitle}</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting dashed line */}
          <div className="hidden md:block absolute top-14 left-[20%] right-[20%] border-t-2 border-dashed border-violet-200 z-0" />

          {steps.items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] || Sparkles;
            return (
              <div key={i} className="relative z-10 group text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center shadow-[0_20px_40px_rgba(124,58,237,0.3)] group-hover:shadow-[0_25px_50px_rgba(124,58,237,0.4)] group-hover:-translate-y-2 transition-all duration-300">
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center text-violet-700 font-black text-sm shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   FEATURES — Bento Grid
   ════════════════════════════════════════════ */
function FeaturesSection({ features }) {
  if (features.visible === false) return null;
  const items = (features.items || []).filter(f => f.visible !== false);

  // Bento layout: first item is large, rest are normal
  return (
    <section id="features" className="py-28 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">Características</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">{features.title}</h2>
          {features.subtitle && <p className="text-xl text-gray-400 max-w-2xl mx-auto">{features.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ id, icon, title, description }, i) => {
            const Icon = ICON_MAP[icon] || Sparkles;
            const isHero = i === 0;
            const isMedium = i === 3;
            return (
              <div key={id || title}
                className={`group relative rounded-3xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm p-8 transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(124,58,237,0.1)] overflow-hidden
                  ${isHero ? 'lg:col-span-2 lg:row-span-1' : ''}
                  ${isMedium ? 'lg:col-span-2' : ''}
                `}
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-violet-600/5 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-violet-600/40 transition-all duration-300 ${isHero ? 'w-16 h-16' : ''}`}>
                  <Icon className={`text-violet-400 ${isHero ? 'w-8 h-8' : 'w-6 h-6'}`} />
                </div>
                <h3 className={`font-bold text-white mb-3 ${isHero ? 'text-2xl' : 'text-xl'}`}>{title}</h3>
                <p className={`text-gray-400 leading-relaxed ${isHero ? 'text-lg' : ''}`}>{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   GALLERY — Horizontal Scroll
   ════════════════════════════════════════════ */
function GallerySection({ gallery }) {
  if (gallery.visible === false || !gallery.images?.length) return null;
  return (
    <section className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-widest mb-4">Galería</span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-5">{gallery.title}</h2>
          {gallery.subtitle && <p className="text-xl text-gray-500 max-w-2xl mx-auto">{gallery.subtitle}</p>}
        </div>

        <div className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
          {gallery.images.map((url, i) => (
            <div key={i} className="shrink-0 w-64 sm:w-72 aspect-[3/4] rounded-3xl overflow-hidden shadow-xl snap-center relative group cursor-pointer">
              <img src={url} alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                <span className="text-white text-sm font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Ver invitación
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   TESTIMONIALS
   ════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    { name: 'Ana Martínez', role: 'Novia feliz', text: 'Increíble plataforma. Mis invitados quedaron impresionados con el diseño y la facilidad para confirmar asistencia.', avatar: 'AM', stars: 5 },
    { name: 'Carlos Rodríguez', role: 'Organizador de eventos', text: 'Uso InvitApp para todos mis clientes. El panel de control es intuitivo y las analíticas me ayudan a mejorar cada evento.', avatar: 'CR', stars: 5 },
    { name: 'Sofía López', role: 'Mamá de quinceañera', text: 'La invitación de los XV de mi hija quedó preciosa. Todos preguntaban cómo la habíamos hecho. ¡100% recomendado!', avatar: 'SL', stars: 5 },
  ];

  return (
    <section className="py-28 bg-gray-50 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-60" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-widest mb-4">Testimonios</span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-5">Lo que dicen nuestros usuarios</h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
            <span className="ml-2 text-gray-600 font-semibold">4.9/5 de más de 500 reseñas</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-violet-100 transition-all duration-300 hover:-translate-y-1">
              <div className="flex gap-1 mb-5">
                {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 text-[15px]">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   FAQ
   ════════════════════════════════════════════ */
function FAQSection({ faq }) {
  const [open, setOpen] = useState(0);
  if (faq.visible === false || !faq.items?.length) return null;

  return (
    <section className="py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">FAQ</span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-5">{faq.title}</h2>
          {faq.subtitle && <p className="text-xl text-gray-500">{faq.subtitle}</p>}
        </div>

        <div className="space-y-3">
          {faq.items.map((item, i) => (
            <div key={i}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${open === i ? 'border-violet-200 bg-violet-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className={`font-bold pr-4 ${open === i ? 'text-violet-700' : 'text-gray-900'}`}>{item.question}</span>
                <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${open === i ? 'bg-violet-600 text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}>
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>
              <div className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open === i ? '300px' : '0', opacity: open === i ? 1 : 0 }}>
                <div className="px-6 pb-5 text-gray-600 leading-relaxed">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   PRICING
   ════════════════════════════════════════════ */
function PricingSection() {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    api.get('/plans/public').then(r => { if (r.data.success) setPlans(r.data.data || []); }).catch(() => {});
  }, []);

  const active = plans.filter(p => p.is_active);
  if (!active.length) return null;
  const midIdx = Math.floor(active.length / 2);

  return (
    <section id="pricing" className="py-28 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">Precios</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">Planes claros y simples</h2>
          <p className="text-xl text-gray-400">Comienza gratis. Mejora cuando lo necesites.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
          {active.map((plan, i) => {
            const popular = i === midIdx;
            return (
              <div key={plan.id} className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col ${
                popular
                  ? 'bg-gradient-to-b from-violet-600 to-violet-700 shadow-[0_0_60px_rgba(124,58,237,0.4)] scale-105 z-10'
                  : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20'
              }`}>
                {popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-white text-violet-700 text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                    ⭐ Más popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-black mb-1 ${popular ? 'text-white' : 'text-white'}`}>{plan.name}</h3>
                  <p className={`text-sm ${popular ? 'text-violet-200' : 'text-gray-500'}`}>{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black ${popular ? 'text-white' : 'text-white'}`}>
                      ${plan.price_usd ?? plan.price ?? 0}
                    </span>
                    <span className={`mb-2 font-medium ${popular ? 'text-violet-200' : 'text-gray-500'}`}>
                      /{(plan.duration_months ?? 1) === 1 ? 'mes' : `${plan.duration_months} meses`}
                    </span>
                  </div>
                  {(plan.price_usd === 0 || plan.price === 0) && (
                    <p className={`text-xs mt-1 ${popular ? 'text-violet-200' : 'text-gray-500'}`}>Para siempre gratis</p>
                  )}
                  {(plan.duration_months ?? 1) > 1 && (
                    <p className={`text-xs mt-1 font-semibold ${popular ? 'text-violet-200' : 'text-violet-400'}`}>
                      {plan.duration_months} meses de acceso incluidos
                    </p>
                  )}
                </div>

                <Link href="/login" className="block mb-8">
                  <button className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    popular
                      ? 'bg-white text-violet-700 hover:bg-violet-50 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}>
                    Empezar con {plan.name}
                  </button>
                </Link>

                <div className="space-y-3 flex-1">
                  {[
                    plan.max_events !== undefined ? `${plan.max_events === -1 ? 'Eventos ilimitados' : `${plan.max_events} evento${plan.max_events !== 1 ? 's' : ''}`}` : null,
                    plan.max_guests !== undefined ? `${plan.max_guests === -1 ? 'Invitados ilimitados' : `${plan.max_guests} invitados por evento`}` : null,
                    plan.max_users !== undefined ? `${plan.max_users === -1 ? 'Usuarios ilimitados' : `${plan.max_users} usuario${plan.max_users !== 1 ? 's' : ''} en equipo`}` : null,
                  ].filter(Boolean).map(feat => (
                    <div key={feat} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${popular ? 'bg-white/20' : 'bg-violet-500/20'}`}>
                        <Check className={`w-3 h-3 ${popular ? 'text-white' : 'text-violet-400'}`} />
                      </div>
                      <span className={`text-sm font-medium ${popular ? 'text-violet-100' : 'text-gray-400'}`}>{feat}</span>
                    </div>
                  ))}

                  {plan.permissions?.length > 0 && (
                    <div className={`pt-3 mt-3 border-t ${popular ? 'border-violet-500/40' : 'border-white/10'}`}>
                      {plan.permissions.map(perm => (
                        <div key={perm.id} className="flex items-center gap-3 mt-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${popular ? 'bg-white/20' : 'bg-violet-500/20'}`}>
                            <Check className={`w-3 h-3 ${popular ? 'text-white' : 'text-violet-400'}`} />
                          </div>
                          <span className={`text-sm font-medium ${popular ? 'text-violet-100' : 'text-gray-400'}`}>{perm.description || perm.key_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-gray-600 text-sm mt-10">
          ¿Necesitas algo personalizado?{' '}
          <a href="mailto:hola@invitapp.com" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Contáctanos</a>
        </p>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   CTA BANNER
   ════════════════════════════════════════════ */
function CTASection({ cta }) {
  if (cta.visible === false) return null;
  return (
    <section className="py-28 relative overflow-hidden bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-[2.5rem] overflow-hidden p-12 sm:p-16 text-center"
          style={{ background: `linear-gradient(135deg, ${cta.bgColor || '#7c3aed'} 0%, #db2777 100%)` }}>
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Empieza hoy mismo
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">{cta.title}</h2>
            {cta.description && <p className="text-white/80 text-xl mb-10 max-w-2xl mx-auto">{cta.description}</p>}
            {cta.ctaText && (
              <Link href="/login">
                <button className="inline-flex items-center gap-3 px-10 py-5 bg-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  style={{ color: cta.bgColor || '#7c3aed' }}>
                  {cta.ctaText}
                  <ArrowRight className="w-6 h-6" />
                </button>
              </Link>
            )}
            <p className="text-white/60 text-sm mt-5 flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-white/80" />
              Sin tarjeta de crédito · Cancela cuando quieras
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════ */
function Footer({ footer, appSettings }) {
  if (footer.visible === false) return null;
  return (
    <footer className="bg-gray-950 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center overflow-hidden shadow-lg shadow-violet-900/50">
                {appSettings.logo_url
                  ? <img src={appSettings.logo_url} alt={appSettings.app_name} className="w-full h-full object-cover" />
                  : <Sparkles className="w-5 h-5 text-white" />
                }
              </div>
              <span className="font-black text-white text-xl">{appSettings.app_name}</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              La plataforma más completa para crear y gestionar invitaciones digitales para cualquier tipo de evento.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-bold text-sm mb-4">Producto</p>
            <div className="space-y-3">
              {['Características', 'Precios', 'Plantillas', 'Integraciones'].map(link => (
                <a key={link} href="#" className="block text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white font-bold text-sm mb-4">Empresa</p>
            <div className="space-y-3">
              {['Acerca de', 'Blog', 'Contacto', 'Privacidad'].map(link => (
                <a key={link} href="#" className="block text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            {footer.copyright || `© ${new Date().getFullYear()} ${appSettings.app_name}. Todos los derechos reservados.`}
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Términos</a>
            <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Privacidad</a>
            <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */
export default function LandingPage() {
  const appSettings = useAppSettings();
  const lc = mergeLanding(appSettings.landing_content);
  const { hero, slideshow, features, steps, gallery, faq, stats, cta, footer } = lc;
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-violet-200">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 transition-all duration-300 ${scrolled ? 'mt-2' : 'mt-4'}`}>
          <div className={`flex items-center justify-between h-16 rounded-2xl px-5 transition-all duration-300 ${
            scrolled
              ? 'bg-gray-950/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
              : 'bg-white/5 backdrop-blur-sm border border-white/10'
          }`}>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center overflow-hidden shadow-md shadow-violet-900/50">
                {appSettings.logo_url
                  ? <img src={appSettings.logo_url} alt={appSettings.app_name} className="w-full h-full object-cover" />
                  : <Sparkles className="w-5 h-5 text-white" />
                }
              </div>
              <span className="font-black text-white text-lg tracking-tight">{appSettings.app_name}</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'Características', href: '#features' },
                { label: 'Precios', href: '#pricing' },
                { label: '¿Cómo funciona?', href: '/como-crear' },
              ].map(({ label, href }) => (
                <a key={label} href={href}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white font-semibold rounded-xl hover:bg-white/5 transition-all">
                  {label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/login">
                <button className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all shadow-lg shadow-violet-900/50">
                  Comenzar gratis
                </button>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2 text-gray-400 hover:text-white transition-colors" onClick={() => setMobileNav(o => !o)}>
              {mobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileNav && (
          <div className="md:hidden absolute top-24 left-4 right-4 bg-gray-950/98 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
            <a href="#features" onClick={() => setMobileNav(false)} className="px-4 py-3 font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">Características</a>
            <a href="#pricing" onClick={() => setMobileNav(false)} className="px-4 py-3 font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">Precios</a>
            <Link href="/como-crear" onClick={() => setMobileNav(false)} className="px-4 py-3 font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">¿Cómo funciona?</Link>
            <hr className="my-1 border-white/10" />
            <Link href="/login" onClick={() => setMobileNav(false)} className="px-4 py-3 font-semibold text-gray-300 text-center hover:text-white transition-colors">Iniciar sesión</Link>
            <Link href="/login" onClick={() => setMobileNav(false)} className="px-4 py-3 font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl text-center transition-all">Comenzar gratis</Link>
          </div>
        )}
      </nav>

      {/* ── Sections ── */}
      {hero.visible !== false && <HeroSection hero={hero} slideshow={slideshow} appSettings={appSettings} />}
      <StatsBar stats={stats} />
      <SocialProofBar />
      <StepsSection steps={steps} />
      <FeaturesSection features={features} />
      <GallerySection gallery={gallery} />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection faq={faq} />
      <CTASection cta={cta} />
      <Footer footer={footer} appSettings={appSettings} />
    </div>
  );
}
