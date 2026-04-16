'use client';
import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { patternLineColor } from '../utils/bgStyles';

/* ── Full Google Fonts catalog (same as sectionTypes FONT_OPTIONS) ── */
const ALL_FONTS = [
  { name: 'Inter',               cat: 'Sans-serif' },
  { name: 'Roboto',              cat: 'Sans-serif' },
  { name: 'Open Sans',           cat: 'Sans-serif' },
  { name: 'Lato',                cat: 'Sans-serif' },
  { name: 'Montserrat',          cat: 'Sans-serif' },
  { name: 'Poppins',             cat: 'Sans-serif' },
  { name: 'Nunito',              cat: 'Sans-serif' },
  { name: 'Raleway',             cat: 'Sans-serif' },
  { name: 'Oswald',              cat: 'Sans-serif' },
  { name: 'Josefin Sans',        cat: 'Sans-serif' },
  { name: 'Varela Round',        cat: 'Sans-serif' },
  { name: 'Comfortaa',           cat: 'Sans-serif' },
  { name: 'Asap',                cat: 'Sans-serif' },
  { name: 'Prompt',              cat: 'Sans-serif' },
  { name: 'Questrial',           cat: 'Sans-serif' },
  { name: 'Work Sans',           cat: 'Sans-serif' },
  { name: 'Signika',             cat: 'Sans-serif' },
  { name: 'Playfair Display',    cat: 'Serif' },
  { name: 'Merriweather',        cat: 'Serif' },
  { name: 'Lora',                cat: 'Serif' },
  { name: 'PT Serif',            cat: 'Serif' },
  { name: 'Libre Baskerville',   cat: 'Serif' },
  { name: 'Cormorant Garamond',  cat: 'Serif' },
  { name: 'EB Garamond',         cat: 'Serif' },
  { name: 'Cinzel',              cat: 'Serif' },
  { name: 'Arvo',                cat: 'Serif' },
  { name: 'Antic Didone',        cat: 'Serif' },
  { name: 'Great Vibes',         cat: 'Script' },
  { name: 'Dancing Script',      cat: 'Script' },
  { name: 'Pacifico',            cat: 'Script' },
  { name: 'Satisfy',             cat: 'Script' },
  { name: 'Caveat',              cat: 'Script' },
  { name: 'Cookie',              cat: 'Script' },
  { name: 'Courgette',           cat: 'Script' },
  { name: 'Allura',              cat: 'Script' },
  { name: 'Alex Brush',          cat: 'Script' },
  { name: 'Parisienne',          cat: 'Script' },
  { name: 'Sacramento',          cat: 'Script' },
  { name: 'Pinyon Script',       cat: 'Script' },
  { name: 'Tangerine',           cat: 'Script' },
  { name: 'Italianno',           cat: 'Script' },
  { name: 'Bad Script',          cat: 'Script' },
  { name: 'Petit Formal Script', cat: 'Script' },
  { name: 'Lobster',             cat: 'Display' },
  { name: 'Anton',               cat: 'Display' },
  { name: 'Fjalla One',          cat: 'Display' },
  { name: 'Abril Fatface',       cat: 'Display' },
  { name: 'Bebas Neue',          cat: 'Display' },
  { name: 'Righteous',           cat: 'Display' },
  { name: 'Permanent Marker',    cat: 'Display' },
  { name: 'Fredoka One',         cat: 'Display' },
  { name: 'Alfa Slab One',       cat: 'Display' },
  { name: 'Patua One',           cat: 'Display' },
  { name: 'Teko',                cat: 'Display' },
  { name: 'Acme',                cat: 'Display' },
  { name: 'Amatic SC',           cat: 'Display' },
  { name: 'Cinzel Decorative',   cat: 'Display' },
];

const FONT_CATEGORIES = ['Todas', 'Sans-serif', 'Serif', 'Script', 'Display'];

const COLOR_PALETTES = [
  { name: 'Rosa Elegante', colors: { primary: '#FF4D8F', secondary: '#7c3aed', background: '#fff9fa', text: '#1a1a2e' } },
  { name: 'Oro & Negro',   colors: { primary: '#D4AF37', secondary: '#C0A060', background: '#0f0e0b', text: '#f5f0e8' } },
  { name: 'Azul Marino',   colors: { primary: '#1e3a5f', secondary: '#4a90d9', background: '#f0f4f8', text: '#1a2840' } },
  { name: 'Verde Salvia',  colors: { primary: '#5a7a5a', secondary: '#8a9e7a', background: '#f5f7f0', text: '#2a3525' } },
  { name: 'Melocotón',     colors: { primary: '#f4845f', secondary: '#e8b89a', background: '#fdf5f0', text: '#3d2315' } },
  { name: 'Lavanda',       colors: { primary: '#9b8ec4', secondary: '#c5b8e8', background: '#f5f0ff', text: '#2d1f5e' } },
  { name: 'Coral Boda',    colors: { primary: '#E8927C', secondary: '#F2B5A0', background: '#FFF8F6', text: '#2C1810' } },
  { name: 'Esmeralda',     colors: { primary: '#00695c', secondary: '#4db6ac', background: '#f0faf9', text: '#1a3330' } },
];

const SCROLL_ANIMATIONS = [
  { id: 'none',        label: 'Ninguna' },
  { id: 'fade-up',     label: 'Fade Up' },
  { id: 'fade',        label: 'Fade In' },
  { id: 'slide-left',  label: 'Slide Izq.' },
  { id: 'slide-right', label: 'Slide Der.' },
  { id: 'zoom',        label: 'Zoom In' },
  { id: 'bounce',      label: 'Bounce' },
];

const OPENING_ANIMATIONS = [
  { id: 'none',     label: 'Ninguna',  desc: 'La invitación se muestra directamente' },
  { id: 'envelope', label: 'Sobre',    desc: 'Un sobre que se abre al tocar' },
  { id: 'card',     label: 'Tarjeta',  desc: 'Tarjeta que se voltea al tocar' },
];

const PATTERNS = [
  /* ── Básicos ── */
  { label: 'Puntos',       value: 'radial-gradient(circle, {c} 1.5px, transparent 1.5px)', size: '20px 20px' },
  { label: 'Puntos Finos', value: 'radial-gradient(circle, {c} 1px, transparent 1px)',     size: '12px 12px' },
  { label: 'Puntos Gdes',  value: 'radial-gradient(circle, {c} 3px, transparent 3px)',     size: '28px 28px' },
  { label: 'Líneas H',     value: 'repeating-linear-gradient(0deg, {c} 0px, {c} 1px, transparent 1px, transparent 20px)', size: '100% 20px' },
  { label: 'Líneas V',     value: 'repeating-linear-gradient(90deg, {c} 0px, {c} 1px, transparent 1px, transparent 20px)', size: '20px 100%' },
  { label: 'Líneas Diag',  value: 'repeating-linear-gradient(45deg, {c} 0px, {c} 1px, transparent 1px, transparent 14px)', size: '20px 20px' },
  { label: 'Diagonal /',   value: 'repeating-linear-gradient(-45deg, {c} 0px, {c} 1px, transparent 1px, transparent 14px)', size: '20px 20px' },
  /* ── Cuadrículas ── */
  { label: 'Cuadrícula',   value: 'linear-gradient({c} 1px,transparent 1px),linear-gradient(90deg,{c} 1px,transparent 1px)', size: '20px 20px' },
  { label: 'Grid Fino',    value: 'linear-gradient({c} 1px,transparent 1px),linear-gradient(90deg,{c} 1px,transparent 1px)', size: '10px 10px' },
  { label: 'Grid Grande',  value: 'linear-gradient({c} 1px,transparent 1px),linear-gradient(90deg,{c} 1px,transparent 1px)', size: '40px 40px' },
  { label: 'Doble Grid',   value: 'linear-gradient({c} 1px,transparent 1px),linear-gradient(90deg,{c} 1px,transparent 1px),linear-gradient({c} 1px,transparent 1px),linear-gradient(90deg,{c} 1px,transparent 1px)', size: '40px 40px, 40px 40px, 8px 8px, 8px 8px' },
  /* ── Geométricos ── */
  { label: 'Diamante',     value: 'repeating-linear-gradient(45deg,{c} 0px,{c} 1px,transparent 1px,transparent 10px),repeating-linear-gradient(-45deg,{c} 0px,{c} 1px,transparent 1px,transparent 10px)', size: '14px 14px' },
  { label: 'Triángulos',   value: 'repeating-linear-gradient(120deg,{c} 0px,{c} 1px,transparent 1px,transparent 50%),repeating-linear-gradient(240deg,{c} 0px,{c} 1px,transparent 1px,transparent 50%)', size: '24px 24px' },
  { label: 'Rombos',       value: 'repeating-linear-gradient(45deg, transparent, transparent 10px, {c} 10px, {c} 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, {c} 10px, {c} 11px)', size: '22px 22px' },
  { label: 'Zigzag',       value: 'repeating-linear-gradient(135deg, {c} 0px, {c} 2px, transparent 2px, transparent 8px), repeating-linear-gradient(45deg, {c} 0px, {c} 2px, transparent 2px, transparent 8px)', size: '16px 8px' },
  { label: 'Hexágonos',    value: 'repeating-linear-gradient(60deg, {c} 0px, {c} 1px, transparent 1px, transparent 20px), repeating-linear-gradient(120deg, {c} 0px, {c} 1px, transparent 1px, transparent 20px), repeating-linear-gradient(180deg, {c} 0px, {c} 1px, transparent 1px, transparent 20px)', size: '23px 40px' },
  /* ── Elegantes ── */
  { label: 'Cruz',         value: 'linear-gradient({c} 2px, transparent 2px), linear-gradient(90deg, {c} 2px, transparent 2px)', size: '30px 30px' },
  { label: 'Plus',         value: 'linear-gradient({c} 1px, transparent 1px) center/20px 20px, linear-gradient(90deg, {c} 1px, transparent 1px) center/20px 20px', size: '20px 20px' },
  { label: 'Tablero',      value: 'linear-gradient(45deg, {c} 25%, transparent 25%), linear-gradient(-45deg, {c} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, {c} 75%), linear-gradient(-45deg, transparent 75%, {c} 75%)', size: '20px 20px' },
  { label: 'Baldosas',     value: 'repeating-linear-gradient(0deg, transparent, transparent 24px, {c} 24px, {c} 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, {c} 24px, {c} 25px)', size: '25px 25px' },
  { label: 'Escamas',      value: 'radial-gradient(circle at 0% 50%, transparent 20px, {c} 20px, {c} 21px, transparent 21px), radial-gradient(circle at 100% 50%, transparent 20px, {c} 20px, {c} 21px, transparent 21px)', size: '40px 20px' },
  { label: 'Olas',         value: 'repeating-radial-gradient(circle at 0 0, transparent 0, {c} 10px), repeating-linear-gradient({c}, transparent)', size: '30px 30px' },
  { label: 'Puntos Cruz',  value: 'radial-gradient(circle, {c} 1px, transparent 1px), radial-gradient(circle, {c} 1px, transparent 1px)', size: '20px 20px, 10px 10px' },
  { label: 'Franjas',      value: 'repeating-linear-gradient(45deg, {c} 0px, {c} 10px, transparent 10px, transparent 20px)', size: '28px 28px' },
  { label: 'Tramado',      value: 'repeating-linear-gradient(45deg, {c} 0, {c} 1px, transparent 0, transparent 50%), repeating-linear-gradient(-45deg, {c} 0, {c} 1px, transparent 0, transparent 50%)', size: '10px 10px' },
  { label: 'Lunares',      value: 'radial-gradient(ellipse at center, {c} 2px, transparent 2px)', size: '16px 16px' },
  { label: 'Telarañas',    value: 'repeating-radial-gradient(ellipse at 50% 50%, transparent 5px, {c} 6px, transparent 7px)', size: '30px 30px' },
];

export default function GlobalThemeDrawer({ theme, onUpdateTheme, onClose, defaultTab = 'background' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [fontCat, setFontCat] = useState('Todas');
  const [fontSearch, setFontSearch] = useState('');

  const tabs = [
    { id: 'background', label: 'Fondo' },
    { id: 'colors',     label: 'Colores' },
    { id: 'fonts',      label: 'Fuentes' },
    { id: 'opening',    label: 'Apertura' },
    { id: 'animations', label: 'Animaciones' },
  ];

  const filteredFonts = useMemo(() => {
    let list = ALL_FONTS;
    if (fontCat !== 'Todas') list = list.filter(f => f.cat === fontCat);
    if (fontSearch.trim()) {
      const q = fontSearch.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [fontCat, fontSearch]);

  const set = (key, val) => onUpdateTheme({ ...theme, [key]: val });

  return (
    <div className="fixed inset-0 z-[150]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl drawer-enter"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Diseño global</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs — scrollable */}
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto px-4 gap-0.5" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3.5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar p-5 pb-10" style={{ maxHeight: 'calc(80vh - 150px)' }}>

          {/* ═══════ BACKGROUND TAB ═══════ */}
          {activeTab === 'background' && (
            <div className="space-y-5">
              <p className="text-xs text-gray-400">Fondo general del body de la invitación</p>

              {/* Type selector */}
              <div className="grid grid-cols-5 gap-1.5">
                {['none', 'color', 'gradient', 'image', 'pattern'].map(type => (
                  <button
                    key={type}
                    onClick={() => set('bodyBgType', type)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      (theme.bodyBgType || 'none') === type
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'none' ? 'Ninguno' : type === 'color' ? 'Color' : type === 'gradient' ? 'Gradiente' : type === 'image' ? 'Imagen' : 'Patrón'}
                  </button>
                ))}
              </div>

              {/* Color */}
              {(theme.bodyBgType) === 'color' && (
                <div className="flex items-center gap-3">
                  <label className="relative cursor-pointer flex-shrink-0">
                    <input type="color" value={theme.bodyBgColor || '#ffffff'} onChange={e => set('bodyBgColor', e.target.value)} className="sr-only" />
                    <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-pink-300 transition-all cursor-pointer" style={{ background: theme.bodyBgColor || '#ffffff' }} />
                  </label>
                  <input
                    type="text" value={theme.bodyBgColor || ''} onChange={e => set('bodyBgColor', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 text-sm font-mono px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none"
                  />
                </div>
              )}

              {/* Gradient */}
              {(theme.bodyBgType) === 'gradient' && (
                <div>
                  <input
                    type="text" value={theme.bodyBgGradient || ''} onChange={e => set('bodyBgGradient', e.target.value)}
                    placeholder="linear-gradient(135deg, #ff6b6b, #5f27cd)"
                    className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none"
                  />
                  {theme.bodyBgGradient && (
                    <div className="mt-3 h-16 rounded-xl border border-gray-200" style={{ background: theme.bodyBgGradient }} />
                  )}
                </div>
              )}

              {/* Image */}
              {(theme.bodyBgType) === 'image' && (
                <ImageUpload value={theme.bodyBgImage || ''} onChange={url => set('bodyBgImage', url)} label="Imagen de fondo" />
              )}

              {/* Pattern */}
              {(theme.bodyBgType) === 'pattern' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 font-medium">Elige un patrón</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PATTERNS.map(p => {
                      const previewColor = patternLineColor(theme.bodyBgPatternColor || '#000000', theme.bodyBgPatternOpacity ?? 12);
                      const previewCss = p.value.replace(/\{c\}/g, previewColor);
                      return (
                        <button
                          key={p.label}
                          onClick={() => onUpdateTheme({ ...theme, bodyBgPattern: p.value, bodyBgPatternSize: p.size })}
                          className={`h-14 rounded-xl border-2 transition-all text-[10px] font-semibold flex items-end justify-center pb-1 ${
                            theme.bodyBgPattern === p.value ? 'border-pink-500 text-pink-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                          }`}
                          style={{
                            backgroundImage: previewCss,
                            backgroundSize: p.size,
                            backgroundColor: theme.bodyBgPatternBase || '#ffffff',
                          }}
                        >
                          <span className="bg-white/80 px-1 rounded">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Color de líneas */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Color de líneas</p>
                    <div className="flex items-center gap-3">
                      <label className="relative cursor-pointer flex-shrink-0">
                        <input type="color" value={theme.bodyBgPatternColor || '#000000'} onChange={e => set('bodyBgPatternColor', e.target.value)} className="sr-only" />
                        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-pink-300 transition-all cursor-pointer" style={{ background: theme.bodyBgPatternColor || '#000000' }} />
                      </label>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-gray-600">Opacidad</p>
                          <span className="text-xs font-mono text-gray-500">{theme.bodyBgPatternOpacity ?? 12}%</span>
                        </div>
                        <input
                          type="range" min="1" max="100"
                          value={theme.bodyBgPatternOpacity ?? 12}
                          onChange={e => set('bodyBgPatternOpacity', Number(e.target.value))}
                          className="w-full accent-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color de fondo */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Color de fondo</p>
                    <div className="flex items-center gap-3">
                      <label className="relative cursor-pointer flex-shrink-0">
                        <input type="color" value={theme.bodyBgPatternBase || '#ffffff'} onChange={e => set('bodyBgPatternBase', e.target.value)} className="sr-only" />
                        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-pink-300 transition-all cursor-pointer" style={{ background: theme.bodyBgPatternBase || '#ffffff' }} />
                      </label>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 mb-1">Hex</p>
                        <input type="text" value={theme.bodyBgPatternBase || '#ffffff'} onChange={e => set('bodyBgPatternBase', e.target.value)}
                          className="w-full text-xs font-mono px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ COLORS TAB ═══════ */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <p className="text-xs text-gray-400">Elige una paleta o personaliza los colores</p>
              <div className="grid grid-cols-2 gap-2.5">
                {COLOR_PALETTES.map(palette => (
                  <button
                    key={palette.name}
                    onClick={() => onUpdateTheme({ ...theme, ...palette.colors })}
                    className="p-3 rounded-2xl border-2 border-gray-100 hover:border-pink-400 text-left transition-all group"
                  >
                    <div className="flex gap-1.5 mb-2">
                      {Object.values(palette.colors).slice(0, 4).map((c, i) => (
                        <div key={i} className="flex-1 h-5 rounded-md" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 group-hover:text-pink-600">{palette.name}</p>
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Personalizar</p>
                <div className="space-y-3">
                  {[
                    { key: 'primary',    label: 'Color principal' },
                    { key: 'secondary',  label: 'Color secundario' },
                    { key: 'background', label: 'Fondo' },
                    { key: 'text',       label: 'Texto' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="relative cursor-pointer flex-shrink-0">
                        <input type="color" value={theme[key] || '#000000'} onChange={e => set(key, e.target.value)} className="sr-only" />
                        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-pink-300 transition-all cursor-pointer" style={{ background: theme[key] || '#000000' }} />
                      </label>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
                        <input type="text" value={theme[key] || ''} onChange={e => set(key, e.target.value)}
                          className="w-full text-xs font-mono px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ FONTS TAB ═══════ */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Tipografía principal de la invitación</p>

              {/* Search */}
              <input
                type="text" value={fontSearch} onChange={e => setFontSearch(e.target.value)}
                placeholder="Buscar fuente..."
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none"
              />

              {/* Category pills */}
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {FONT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFontCat(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      fontCat === cat ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Font list */}
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {filteredFonts.map(font => (
                  <button
                    key={font.name}
                    onClick={() => set('fontFamily', font.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                      theme.fontFamily === font.name
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xl text-gray-800 truncate" style={{ fontFamily: `"${font.name}", sans-serif` }}>
                        Aa Invitación
                      </p>
                      <p className="text-[11px] text-gray-400">{font.name} · {font.cat}</p>
                    </div>
                    {theme.fontFamily === font.name && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center flex-shrink-0 ml-2">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                    )}
                  </button>
                ))}
                {filteredFonts.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">No se encontraron fuentes</p>
                )}
              </div>
            </div>
          )}

          {/* ═══════ OPENING ANIMATION TAB ═══════ */}
          {activeTab === 'opening' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Animación de apertura al abrir la invitación</p>
              <div className="space-y-2">
                {OPENING_ANIMATIONS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => set('openingAnimation', anim.id)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      (theme.openingAnimation || 'none') === anim.id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold ${(theme.openingAnimation || 'none') === anim.id ? 'text-pink-600' : 'text-gray-800'}`}>
                          {anim.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{anim.desc}</p>
                      </div>
                      {(theme.openingAnimation || 'none') === anim.id && (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Envelope customization */}
              {theme.openingAnimation === 'envelope' && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Personalizar sobre</p>
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer flex-shrink-0">
                      <input type="color" value={theme.envelopeColor || '#f5f0e8'} onChange={e => set('envelopeColor', e.target.value)} className="sr-only" />
                      <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-pink-300 transition-all cursor-pointer" style={{ background: theme.envelopeColor || '#f5f0e8' }} />
                    </label>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-600 mb-1">Color del sobre</p>
                      <input type="text" value={theme.envelopeColor || '#f5f0e8'} onChange={e => set('envelopeColor', e.target.value)}
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Texto del sobre</p>
                    <input type="text" value={theme.envelopeText || ''} onChange={e => set('envelopeText', e.target.value)}
                      placeholder="Tenemos una noticia..."
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Texto CTA</p>
                    <input type="text" value={theme.envelopeCTA || ''} onChange={e => set('envelopeCTA', e.target.value)}
                      placeholder="¡PULSA AQUÍ Y DESLIZA!"
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer flex-shrink-0">
                      <input type="color" value={theme.sealColor || '#C5A55A'} onChange={e => set('sealColor', e.target.value)} className="sr-only" />
                      <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-pink-300 transition-all cursor-pointer" style={{ background: theme.sealColor || '#C5A55A' }} />
                    </label>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-600 mb-1">Color del sello</p>
                      <input type="text" value={theme.sealColor || '#C5A55A'} onChange={e => set('sealColor', e.target.value)}
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Card customization */}
              {theme.openingAnimation === 'card' && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Personalizar tarjeta</p>
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer flex-shrink-0">
                      <input type="color" value={theme.cardColor || '#ffffff'} onChange={e => set('cardColor', e.target.value)} className="sr-only" />
                      <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-200 hover:ring-pink-300 transition-all cursor-pointer" style={{ background: theme.cardColor || '#ffffff' }} />
                    </label>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-600 mb-1">Color de tarjeta</p>
                      <input type="text" value={theme.cardColor || '#ffffff'} onChange={e => set('cardColor', e.target.value)}
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Texto frontal</p>
                    <input type="text" value={theme.cardText || ''} onChange={e => set('cardText', e.target.value)}
                      placeholder="Estás invitado..."
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ SCROLL ANIMATIONS TAB ═══════ */}
          {activeTab === 'animations' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Animación de entrada para cada sección al hacer scroll</p>
              <div className="grid grid-cols-2 gap-2">
                {SCROLL_ANIMATIONS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => set('animation', anim.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-center ${
                      theme.animation === anim.id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${theme.animation === anim.id ? 'text-pink-600' : 'text-gray-600'}`}>
                      {anim.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
