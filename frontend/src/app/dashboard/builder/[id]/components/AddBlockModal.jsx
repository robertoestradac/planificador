'use client';
import { useState, useMemo } from 'react';
import { getAllSectionTypes } from '../config/sectionTypes';
import {
  X, Search, Sparkles, LayoutTemplate, Image, Film,
  CalendarDays, Users, Wrench, Heart, Crown, Cake, Baby, GraduationCap, Building2,
} from 'lucide-react';
import * as Icons from 'lucide-react';

/* ── Categorías de bloques ── */
const CATEGORIES = [
  { id: 'all',        label: 'Todos',        Icon: Sparkles },
  { id: 'plantillas', label: 'Plantillas',   Icon: LayoutTemplate },
  { id: 'portada',    label: 'Portada',      Icon: Image },
  { id: 'multimedia', label: 'Multimedia',   Icon: Film },
  { id: 'evento',     label: 'Evento',       Icon: CalendarDays },
  { id: 'social',     label: 'Social',       Icon: Users },
  { id: 'utilidad',   label: 'Utilidad',     Icon: Wrench },
];

const CAT_LABELS = {
  portada:    'Portada',
  multimedia: 'Multimedia',
  evento:     'Evento',
  social:     'Social',
  utilidad:   'Utilidad',
};

/* ── Themed preset packs ── */
const PRESETS = [
  {
    id: 'boda-elegante',
    name: 'Boda Elegante',
    Icon: Heart,
    description: 'Hero, pareja, itinerario, galería, regalos, RSVP',
    sections: ['hero', 'couple', 'countdown', 'schedule', 'gallery', 'dress_code', 'gifts', 'map', 'rsvp'],
  },
  {
    id: 'xv-anos',
    name: 'XV Años',
    Icon: Crown,
    description: 'Hero, cuenta regresiva, galería, itinerario, vestimenta',
    sections: ['hero', 'countdown', 'gallery', 'schedule', 'dress_code', 'map', 'rsvp'],
  },
  {
    id: 'cumple-infantil',
    name: 'Cumpleaños Infantil',
    Icon: Cake,
    description: 'Hero, cuenta regresiva, galería, ubicación, RSVP',
    sections: ['hero', 'countdown', 'gallery', 'map', 'rsvp'],
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    Icon: Baby,
    description: 'Hero, cuenta regresiva, galería, regalos, ubicación',
    sections: ['hero', 'countdown', 'gallery', 'gifts', 'map', 'rsvp'],
  },
  {
    id: 'graduacion',
    name: 'Graduación',
    Icon: GraduationCap,
    description: 'Hero, galería, itinerario, ubicación, RSVP',
    sections: ['hero', 'gallery', 'schedule', 'map', 'rsvp'],
  },
  {
    id: 'corporativo',
    name: 'Evento Corporativo',
    Icon: Building2,
    description: 'Hero, itinerario, menú, hospedaje, ubicación',
    sections: ['hero', 'schedule', 'menu_event', 'hospedaje', 'map', 'rsvp'],
  },
];

const BLOCK_CATEGORY_MAP = {
  hero:        'portada',
  quote:       'portada',
  text:        'portada',
  image:       'multimedia',
  gallery:     'multimedia',
  video:       'multimedia',
  music_player:'multimedia',
  countdown:   'evento',
  schedule:    'evento',
  map:         'evento',
  rsvp:        'evento',
  dress_code:  'evento',
  couple:      'social',
  gifts:       'social',
  hospedaje:    'utilidad',
  menu_event:   'utilidad',
  divider:      'utilidad',
  photo_upload: 'multimedia',
  mask:         'multimedia',
};

const BLOCK_DESCRIPTIONS = {
  hero:        'Portada principal con foto y título',
  text:        'Párrafo de texto personalizable',
  image:       'Imagen individual centrada',
  gallery:     'Galería de fotos con lightbox',
  video:       'Video de YouTube, Vimeo o archivo',
  music_player:'Reproductor de música elegante',
  countdown:   'Cuenta regresiva hasta el evento',
  schedule:    'Itinerario del día en timeline',
  map:         'Ubicación en Google Maps',
  rsvp:        'Botón de confirmación de asistencia',
  couple:      'Presentación de los novios/pareja',
  dress_code:  'Código de vestimenta y paleta',
  gifts:       'Mesa de regalos y cuentas bancarias',
  quote:       'Cita, poema o frase especial',
  divider:     'Separador decorativo',
  hospedaje:   'Opciones de hospedaje cercanas',
  menu_event:   'Menú de comida y bebidas',
  photo_upload:  'Fotos enviadas por los invitados',
  mask:           'Texto o imagen con forma de máscara',
};

function DraggableBlockCard({ type, label, icon, onClick }) {
  const IconComponent = Icons[icon] || Icons.Box;
  const description   = BLOCK_DESCRIPTIONS[type] || '';

  return (
    <button
      onClick={() => onClick(type)}
      className="block-card w-full text-left p-3.5 rounded-2xl border-2 border-gray-100 bg-white hover:border-pink-400 focus:outline-none group transition-all"
    >
      <div className="flex items-center gap-3">
        {/* Icon box */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-violet-50 flex items-center justify-center flex-shrink-0 group-hover:from-pink-100 group-hover:to-violet-100 transition-colors">
          <IconComponent className="w-5 h-5 text-violet-600 group-hover:text-pink-500 transition-colors" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 group-hover:text-pink-600 transition-colors truncate">
            {label}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{description}</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-pink-500 flex items-center justify-center flex-shrink-0 transition-colors">
          <span className="text-gray-400 group-hover:text-white text-sm leading-none transition-colors">+</span>
        </div>
      </div>
    </button>
  );
}

function PresetCard({ preset, onClick }) {
  const PresetIcon = preset.Icon;
  return (
    <button
      onClick={() => onClick(preset)}
      className="w-full text-left p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-pink-400 group transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-50 to-violet-50 flex items-center justify-center flex-shrink-0 group-hover:from-pink-100 group-hover:to-violet-100 transition-colors">
          <PresetIcon className="w-6 h-6 text-violet-600 group-hover:text-pink-500 transition-colors" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-800 group-hover:text-pink-600 transition-colors">{preset.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{preset.description}</p>
          <p className="text-[10px] text-violet-500 font-semibold mt-1">{preset.sections.length} secciones</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-pink-500 flex items-center justify-center flex-shrink-0 transition-colors">
          <span className="text-gray-400 group-hover:text-white text-sm leading-none transition-colors">+</span>
        </div>
      </div>
    </button>
  );
}

const CAT_ORDER = ['portada', 'multimedia', 'evento', 'social', 'utilidad'];

export default function AddBlockModal({ onClose, onAddBlock }) {
  const [search,         setSearch]   = useState('');
  const [activeCategory, setCategory] = useState('all');
  const sectionTypes = getAllSectionTypes();
  const q = search.trim().toLowerCase();

  const addBlock = (type) => { onAddBlock(type); onClose(); };

  const handlePreset = (preset) => {
    preset.sections.forEach((type, i) => setTimeout(() => onAddBlock(type), i * 50));
    onClose();
  };

  /* blocks that match the search query (ignores category) */
  const searchResults = useMemo(() => {
    if (!q) return [];
    return sectionTypes.filter(t =>
      t.label.toLowerCase().includes(q) ||
      (BLOCK_DESCRIPTIONS[t.id] || '').toLowerCase().includes(q)
    );
  }, [sectionTypes, q]);

  const matchingPresets = useMemo(() =>
    PRESETS.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
  [q]);

  /* blocks for a specific category tab */
  const categoryBlocks = useMemo(() => {
    if (activeCategory === 'all' || activeCategory === 'plantillas') return [];
    return sectionTypes.filter(t => BLOCK_CATEGORY_MAP[t.id] === activeCategory);
  }, [sectionTypes, activeCategory]);

  /* grouped blocks for "Todos" tab */
  const groupedAll = useMemo(() => {
    return CAT_ORDER.map(catId => ({
      catId,
      label: CAT_LABELS[catId],
      blocks: sectionTypes.filter(t => BLOCK_CATEGORY_MAP[t.id] === catId),
    })).filter(g => g.blocks.length > 0);
  }, [sectionTypes]);

  const noResults = q && searchResults.length === 0 && matchingPresets.length === 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ padding: '16px 16px 28px' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl modal-enter flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Añadir bloque</h2>
              <p className="text-xs text-gray-400 mt-0.5">Elige el tipo de contenido que deseas agregar</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en todos los bloques..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* ── Category tabs — hidden while searching ── */}
        {!q && (
          <div className="flex-shrink-0 px-5 pt-3 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <cat.Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-1" style={{ scrollbarWidth: 'thin' }}>

          {/* SEARCH RESULTS — global across all categories */}
          {q && (
            noResults ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-500">Sin resultados</p>
                <p className="text-xs text-gray-400 mt-1">Intenta con otro término</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 pt-2">
                {matchingPresets.map(p => <PresetCard key={p.id} preset={p} onClick={handlePreset} />)}
                {searchResults.map(t => (
                  <DraggableBlockCard key={t.id} type={t.id} label={t.label} icon={t.icon} onClick={addBlock} />
                ))}
              </div>
            )
          )}

          {/* PLANTILLAS tab */}
          {!q && activeCategory === 'plantillas' && (
            <div className="grid grid-cols-1 gap-2 pt-2">
              {PRESETS.map(p => <PresetCard key={p.id} preset={p} onClick={handlePreset} />)}
            </div>
          )}

          {/* SPECIFIC CATEGORY tab */}
          {!q && activeCategory !== 'all' && activeCategory !== 'plantillas' && (
            categoryBlocks.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">Sin bloques en esta categoría</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 pt-2">
                {categoryBlocks.map(t => (
                  <DraggableBlockCard key={t.id} type={t.id} label={t.label} icon={t.icon} onClick={addBlock} />
                ))}
              </div>
            )
          )}

          {/* ALL tab — grouped by category */}
          {!q && activeCategory === 'all' && (
            <div className="space-y-5 pt-2">
              {groupedAll.map(({ catId, label, blocks }) => (
                <div key={catId}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{label}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {blocks.map(t => (
                      <DraggableBlockCard key={t.id} type={t.id} label={t.label} icon={t.icon} onClick={addBlock} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
