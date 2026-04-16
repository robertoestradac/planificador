'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight,
  Sparkles, Palette, Music2, Type, Image, Layers, Globe,
  Save, Undo2, Redo2, Smartphone, Monitor, Plus,
  Heart, Clock, MapPin, Users, Gift, Camera, Video,
  CalendarDays, Shirt, Quote, Minus, Hotel, UtensilsCrossed,
  MousePointer, Eye, Pencil, Settings, Share2, Zap,
  LayoutTemplate, Search, Star, Play, CheckCircle,
} from 'lucide-react';
import { useAppSettings } from '@/components/layout/AppBranding';

/* ─── Data ─────────────────────────────────────────────────── */

const STEPS = [
  {
    id: 1,
    icon: CalendarDays,
    color: 'from-violet-500 to-violet-600',
    light: 'bg-violet-50 text-violet-700 border-violet-200',
    tag: 'Paso 1',
    title: 'Crea tu evento e invitación',
    description: 'Desde el dashboard, crea primero un evento (boda, XV años, etc.) y luego una invitación asociada a ese evento.',
    details: [
      'Ve a Dashboard → Eventos → Nuevo evento',
      'Ingresa el nombre, fecha y lugar del evento',
      'Luego ve a Invitaciones → Nueva invitación',
      'Selecciona el evento y ponle un título a tu invitación',
    ],
  },
  {
    id: 2,
    icon: LayoutTemplate,
    color: 'from-pink-500 to-rose-500',
    light: 'bg-pink-50 text-pink-700 border-pink-200',
    tag: 'Paso 2',
    title: 'Elige una plantilla o empieza desde cero',
    description: 'Al abrir el builder, usa el botón "+ Añadir bloque" para agregar secciones. Puedes usar plantillas prediseñadas para tu tipo de evento.',
    details: [
      'Haz clic en "+ Añadir bloque" en la barra inferior',
      'Ve a la pestaña "Plantillas" para packs completos',
      'O agrega bloques individuales por categoría',
      'Las plantillas incluyen todos los bloques necesarios',
    ],
  },
  {
    id: 3,
    icon: Palette,
    color: 'from-indigo-500 to-blue-500',
    light: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tag: 'Paso 3',
    title: 'Personaliza colores, fuentes y fondo',
    description: 'Usa la barra de herramientas inferior para cambiar el tema global: colores, tipografías y fondo de la invitación.',
    details: [
      'Botón "Colores" → paleta de colores principal',
      'Botón "Fuentes" → tipografía global',
      'Botón "Fondo" → imagen o color de fondo',
      'Botón "Música" → agrega tu canción favorita',
    ],
  },
  {
    id: 4,
    icon: MousePointer,
    color: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tag: 'Paso 4',
    title: 'Edita cada bloque con un clic',
    description: 'Haz clic en cualquier bloque del canvas para seleccionarlo. Aparecerá el panel de propiedades donde puedes editar todo el contenido.',
    details: [
      'Clic en el bloque → se resalta con borde rosa',
      'Panel lateral derecho con todas las opciones',
      'Edita textos, imágenes, colores y más',
      'Los cambios se ven en tiempo real',
    ],
  },
  {
    id: 5,
    icon: Share2,
    color: 'from-orange-500 to-amber-500',
    light: 'bg-orange-50 text-orange-700 border-orange-200',
    tag: 'Paso 5',
    title: 'Publica y comparte',
    description: 'Cuando estés listo, haz clic en "Compartir" para publicar tu invitación. Obtendrás un enlace único para compartir por WhatsApp o redes sociales.',
    details: [
      'Botón "Compartir" en la barra superior derecha',
      'Tu invitación obtiene un enlace único (slug)',
      'Comparte por WhatsApp, Instagram o email',
      'Monitorea las vistas y confirmaciones en tiempo real',
    ],
  },
];

const BLOCKS = [
  { icon: Image, name: 'Hero / Portada', desc: 'Imagen principal con título y subtítulo del evento', color: 'bg-violet-100 text-violet-600', category: 'Portada' },
  { icon: Heart, name: 'Los Novios', desc: 'Presentación de la pareja con fotos y descripción', color: 'bg-pink-100 text-pink-600', category: 'Social' },
  { icon: Clock, name: 'Cuenta Regresiva', desc: 'Contador animado hacia la fecha del evento', color: 'bg-blue-100 text-blue-600', category: 'Evento' },
  { icon: CalendarDays, name: 'Itinerario', desc: 'Programa del día en formato de línea de tiempo', color: 'bg-indigo-100 text-indigo-600', category: 'Evento' },
  { icon: Camera, name: 'Galería', desc: 'Fotos en grid, masonry o estilo polaroid', color: 'bg-emerald-100 text-emerald-600', category: 'Multimedia' },
  { icon: MapPin, name: 'Mapa / Ubicación', desc: 'Google Maps o Waze integrado con dirección', color: 'bg-red-100 text-red-600', category: 'Evento' },
  { icon: CheckCircle, name: 'RSVP', desc: 'Formulario de confirmación de asistencia', color: 'bg-green-100 text-green-600', category: 'Evento' },
  { icon: Music2, name: 'Música', desc: 'Reproductor con Spotify, YouTube Music o MP3', color: 'bg-purple-100 text-purple-600', category: 'Multimedia' },
  { icon: Gift, name: 'Mesa de Regalos', desc: 'Cuentas bancarias y links a listas externas', color: 'bg-yellow-100 text-yellow-600', category: 'Social' },
  { icon: Shirt, name: 'Código de Vestimenta', desc: 'Paleta de colores y tipo de vestimenta sugerida', color: 'bg-rose-100 text-rose-600', category: 'Evento' },
  { icon: Video, name: 'Video', desc: 'YouTube, Vimeo o archivo MP4 embebido', color: 'bg-cyan-100 text-cyan-600', category: 'Multimedia' },
  { icon: Quote, name: 'Cita / Poema', desc: 'Frase especial, poema o dedicatoria', color: 'bg-fuchsia-100 text-fuchsia-600', category: 'Portada' },
  { icon: Hotel, name: 'Hospedaje', desc: 'Opciones de hoteles cercanos al evento', color: 'bg-teal-100 text-teal-600', category: 'Utilidad' },
  { icon: UtensilsCrossed, name: 'Menú del Evento', desc: 'Menú de comida y bebidas por categorías', color: 'bg-amber-100 text-amber-600', category: 'Utilidad' },
  { icon: Camera, name: 'Fotos del Evento', desc: 'Los invitados suben sus fotos directamente', color: 'bg-sky-100 text-sky-600', category: 'Multimedia' },
  { icon: Minus, name: 'Separador', desc: 'Línea decorativa entre secciones', color: 'bg-gray-100 text-gray-600', category: 'Utilidad' },
];

const PRESETS = [
  { icon: Heart, name: 'Boda Elegante', blocks: 9, color: 'from-pink-500 to-rose-500', desc: 'Hero, pareja, cuenta regresiva, itinerario, galería, vestimenta, regalos, mapa, RSVP' },
  { icon: Star, name: 'XV Años', blocks: 7, color: 'from-violet-500 to-purple-600', desc: 'Hero, cuenta regresiva, galería, itinerario, vestimenta, mapa, RSVP' },
  { icon: Gift, name: 'Baby Shower', blocks: 6, color: 'from-blue-400 to-cyan-500', desc: 'Hero, cuenta regresiva, galería, regalos, mapa, RSVP' },
  { icon: CalendarDays, name: 'Graduación', blocks: 5, color: 'from-emerald-500 to-teal-500', desc: 'Hero, galería, itinerario, mapa, RSVP' },
  { icon: Users, name: 'Corporativo', blocks: 6, color: 'from-gray-600 to-gray-800', desc: 'Hero, itinerario, menú, hospedaje, mapa, RSVP' },
  { icon: Sparkles, name: 'Cumpleaños', blocks: 5, color: 'from-orange-400 to-amber-500', desc: 'Hero, cuenta regresiva, galería, mapa, RSVP' },
];

const TOOLBAR_ITEMS = [
  { icon: Pencil, label: 'Detalles', desc: 'Título, estado y enlace de la invitación' },
  { icon: Image, label: 'Fondo', desc: 'Imagen, color o gradiente de fondo global' },
  { icon: Palette, label: 'Colores', desc: 'Paleta de colores principal y secundaria' },
  { icon: Music2, label: 'Música', desc: 'Agrega o edita el reproductor de música' },
  { icon: Type, label: 'Fuentes', desc: 'Tipografía global para títulos y textos' },
];

const TIPS = [
  { icon: Undo2, title: 'Ctrl + Z / Ctrl + Y', desc: 'Deshacer y rehacer cambios ilimitados' },
  { icon: Save, title: 'Ctrl + S', desc: 'Guardar manualmente (también hay auto-guardado)' },
  { icon: Layers, title: 'Modo Capas', desc: 'Activa el modo libre para mover bloques con precisión' },
  { icon: Smartphone, title: 'Vista previa', desc: 'Alterna entre vista móvil y escritorio en tiempo real' },
  { icon: Globe, title: 'Publicar', desc: 'Botón "Compartir" para obtener el enlace público' },
  { icon: Eye, title: 'Ver publicada', desc: 'Icono de enlace externo para ver la invitación en vivo' },
];

/* ─── Builder UI Mockup ─────────────────────────────────────── */
function BuilderMockup() {
  const [activeTab, setActiveTab] = useState('blocks');
  const [selectedBlock, setSelectedBlock] = useState(null);

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white" style={{ minHeight: 520 }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 leading-none">Mi Boda</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">● Publicada</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button className="p-1 rounded-md bg-white shadow-sm"><Smartphone className="w-3 h-3 text-pink-500" /></button>
            <button className="p-1 rounded-md"><Monitor className="w-3 h-3 text-gray-400" /></button>
          </div>
          <button className="p-1.5 rounded-lg text-gray-400"><Undo2 className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 rounded-lg text-gray-400"><Redo2 className="w-3.5 h-3.5" /></button>
          <button className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg shadow-sm">Compartir</button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex" style={{ height: 420 }}>

        {/* Canvas (phone preview) */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 relative">
          <div className="relative w-44 bg-gray-900 border-4 border-gray-800 rounded-[2rem] shadow-xl overflow-hidden" style={{ height: 360 }}>
            <div className="absolute top-0 inset-x-0 flex justify-center z-10 pt-1">
              <div className="w-16 h-3 bg-gray-900 rounded-b-xl" />
            </div>
            {/* Invitation preview */}
            <div className="w-full h-full overflow-hidden">
              {/* Hero block */}
              <div
                className={`relative w-full transition-all duration-200 cursor-pointer ${selectedBlock === 'hero' ? 'ring-2 ring-pink-500 ring-inset' : ''}`}
                style={{ height: 130, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                onClick={() => setSelectedBlock(selectedBlock === 'hero' ? null : 'hero')}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
                  <p className="text-[10px] font-bold tracking-widest opacity-70 uppercase">Ana & Carlos</p>
                  <p className="text-sm font-black mt-0.5">Nuestra Boda</p>
                  <p className="text-[9px] opacity-70 mt-0.5">25 · Dic · 2025</p>
                </div>
                {selectedBlock === 'hero' && (
                  <div className="absolute top-1 right-1 bg-pink-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">Editando</div>
                )}
              </div>
              {/* Countdown block */}
              <div
                className={`bg-white px-3 py-2 cursor-pointer transition-all ${selectedBlock === 'countdown' ? 'ring-2 ring-pink-500 ring-inset' : ''}`}
                onClick={() => setSelectedBlock(selectedBlock === 'countdown' ? null : 'countdown')}
              >
                <p className="text-[8px] text-center text-gray-400 font-semibold uppercase tracking-wider mb-1">Faltan</p>
                <div className="flex justify-center gap-2">
                  {[['45', 'Días'], ['12', 'Hrs'], ['30', 'Min']].map(([n, l]) => (
                    <div key={l} className="text-center">
                      <p className="text-sm font-black text-violet-600">{n}</p>
                      <p className="text-[7px] text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Gallery block */}
              <div
                className={`bg-gray-50 p-2 cursor-pointer transition-all ${selectedBlock === 'gallery' ? 'ring-2 ring-pink-500 ring-inset' : ''}`}
                onClick={() => setSelectedBlock(selectedBlock === 'gallery' ? null : 'gallery')}
              >
                <p className="text-[8px] text-center text-gray-500 font-bold mb-1.5">Galería</p>
                <div className="grid grid-cols-3 gap-0.5">
                  {['#f9a8d4','#c4b5fd','#93c5fd','#6ee7b7','#fcd34d','#fb923c'].map((c, i) => (
                    <div key={i} className="aspect-square rounded-sm" style={{ background: c }} />
                  ))}
                </div>
              </div>
              {/* RSVP block */}
              <div
                className={`bg-white px-3 py-2 cursor-pointer transition-all ${selectedBlock === 'rsvp' ? 'ring-2 ring-pink-500 ring-inset' : ''}`}
                onClick={() => setSelectedBlock(selectedBlock === 'rsvp' ? null : 'rsvp')}
              >
                <p className="text-[8px] text-center text-gray-600 mb-1.5">¿Confirmas tu asistencia?</p>
                <div className="bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[8px] font-bold text-center py-1.5 rounded-lg">
                  Confirmar Asistencia
                </div>
              </div>
            </div>
          </div>

          {/* Click hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 backdrop-blur border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <MousePointer className="w-3 h-3 text-pink-500" />
            <span className="text-[10px] font-semibold text-gray-600">Haz clic en un bloque para editarlo</span>
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-56 border-l border-gray-100 bg-white flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900">
              {selectedBlock ? `Editando: ${selectedBlock === 'hero' ? 'Hero' : selectedBlock === 'countdown' ? 'Cuenta Regresiva' : selectedBlock === 'gallery' ? 'Galería' : 'RSVP'}` : 'Propiedades'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {selectedBlock ? 'Modifica el contenido del bloque' : 'Selecciona un bloque para editar'}
            </p>
          </div>

          {selectedBlock ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {selectedBlock === 'hero' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Título</label>
                    <div className="mt-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">Nuestra Boda</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subtítulo</label>
                    <div className="mt-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">25 de Diciembre, 2025</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Imagen de fondo</label>
                    <div className="mt-1 h-14 bg-gradient-to-br from-violet-200 to-pink-200 rounded-lg flex items-center justify-center">
                      <Image className="w-4 h-4 text-violet-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Color de texto</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-white border-2 border-gray-300" />
                      <span className="text-xs text-gray-600">#ffffff</span>
                    </div>
                  </div>
                </>
              )}
              {selectedBlock === 'countdown' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha objetivo</label>
                    <div className="mt-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">2025-12-25</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Color de números</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-600" />
                      <span className="text-xs text-gray-600">#7c3aed</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {['Mostrar días', 'Mostrar horas', 'Mostrar minutos'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-violet-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-[10px] text-gray-600">{opt}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selectedBlock === 'gallery' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estilo</label>
                    <div className="mt-1 flex gap-1">
                      {['Grid', 'Polaroid', 'Masonry'].map((s, i) => (
                        <button key={s} className={`flex-1 py-1 text-[9px] font-semibold rounded-md ${i === 1 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Imágenes (6)</label>
                    <div className="mt-1 grid grid-cols-3 gap-1">
                      {['#f9a8d4','#c4b5fd','#93c5fd','#6ee7b7','#fcd34d','#fb923c'].map((c, i) => (
                        <div key={i} className="aspect-square rounded-md" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </>
              )}
              {selectedBlock === 'rsvp' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Título</label>
                    <div className="mt-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">Confirma tu asistencia</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Color del botón</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-r from-pink-500 to-violet-600" />
                      <span className="text-xs text-gray-600">Gradiente</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Texto del botón</label>
                    <div className="mt-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">Confirmar Asistencia</div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <MousePointer className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs font-semibold text-gray-500">Selecciona un bloque</p>
              <p className="text-[10px] text-gray-400 mt-1">Haz clic en cualquier sección del canvas</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-center gap-1 px-4 py-2 bg-white border-t border-gray-100">
        {TOOLBAR_ITEMS.map(({ icon: Icon, label }) => (
          <button key={label} className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[9px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all">
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-violet-600 shadow-md">
          <Plus className="w-3.5 h-3.5" />
          Añadir bloque
        </button>
      </div>
    </div>
  );
}

/* ─── Add Block Modal Mockup ────────────────────────────────── */
function AddBlockMockup() {
  const [activeTab, setActiveTab] = useState('all');
  const tabs = ['Todos', 'Plantillas', 'Portada', 'Multimedia', 'Evento', 'Social', 'Utilidad'];

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Añadir bloque</p>
            <p className="text-[10px] text-gray-400">Elige el tipo de contenido</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs">✕</span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <div className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-400">
            Buscar bloques...
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Block list */}
      <div className="px-3 pb-4 space-y-1.5 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {BLOCKS.slice(0, 6).map(({ icon: Icon, name, desc, color }) => (
          <div key={name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 hover:border-pink-300 bg-white group cursor-pointer transition-all">
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">{name}</p>
              <p className="text-[9px] text-gray-400 truncate">{desc}</p>
            </div>
            <div className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-pink-500 flex items-center justify-center shrink-0 transition-colors">
              <Plus className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function ComoCrearPage() {
  const appSettings = useAppSettings();
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: '¿Puedo cambiar el diseño después de publicar?', a: 'Sí, puedes editar tu invitación en cualquier momento. Los cambios se reflejan instantáneamente para todos los que tengan el enlace.' },
    { q: '¿Cuántos bloques puedo agregar?', a: 'No hay límite de bloques. Puedes agregar tantas secciones como necesites para tu invitación.' },
    { q: '¿Mis invitados necesitan instalar algo?', a: 'No. Solo necesitan el enlace. La invitación se abre en cualquier navegador web, sin apps ni registros.' },
    { q: '¿Puedo agregar música de Spotify?', a: 'Sí. El bloque de Música soporta Spotify, YouTube Music, Deezer, Apple Music y archivos MP3 propios.' },
    { q: '¿Cómo veo quién confirmó asistencia?', a: 'Desde el Dashboard → Invitados. Verás en tiempo real quién confirmó, declinó o está pendiente.' },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center overflow-hidden">
              {appSettings.logo_url
                ? <img src={appSettings.logo_url} alt={appSettings.app_name} className="w-full h-full object-cover" />
                : <Sparkles className="w-4 h-4 text-white" />
              }
            </div>
            <span className="font-black text-gray-900">{appSettings.app_name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Inicio
            </Link>
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-sm">
                Crear invitación
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-b from-gray-950 to-gray-900 pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-violet-300 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            Guía completa del builder
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
            ¿Cómo crear una
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 mt-1">
              invitación digital?
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Aprende a usar el builder visual paso a paso. En menos de 10 minutos tendrás una invitación profesional lista para compartir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            {[
              { icon: Clock, text: '~10 min para crear' },
              { icon: Smartphone, text: 'Sin código' },
              { icon: Globe, text: 'Enlace instantáneo' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-violet-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Builder Demo ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-widest mb-4">Demo interactivo</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Así se ve el builder</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Haz clic en los bloques del canvas para ver cómo funciona el panel de propiedades en tiempo real.</p>
          </div>
          <BuilderMockup />
        </div>
      </section>

      {/* ── Step by Step ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-widest mb-4">Paso a paso</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Crea tu invitación en 5 pasos</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Sigue esta guía y tendrás tu invitación lista en minutos.</p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="group flex gap-6 p-6 rounded-3xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300 bg-white">
                  {/* Number + icon */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-100 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${step.light}`}>{step.tag}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-500 mb-4 leading-relaxed">{step.description}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {step.details.map((detail, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-600">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Toolbar Guide ── */}
      <section className="py-20 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">Barra de herramientas</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Controles del builder</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Cada botón de la barra inferior tiene una función específica para personalizar tu invitación.</p>
          </div>

          {/* Toolbar visual */}
          <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-3xl px-4 py-3 mb-12 max-w-2xl mx-auto backdrop-blur-sm">
            {TOOLBAR_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <Icon className="w-4 h-4 text-gray-300" />
                <span className="text-[10px] font-semibold text-gray-400">{label}</span>
              </div>
            ))}
            <div className="w-px h-8 bg-white/10 mx-1" />
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold">
              <Plus className="w-3.5 h-3.5" />
              Añadir bloque
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLBAR_ITEMS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{label}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-4 p-5 rounded-2xl bg-gradient-to-br from-pink-500/10 to-violet-600/10 border border-pink-500/20 hover:from-pink-500/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm mb-1">+ Añadir bloque</p>
                <p className="text-gray-400 text-xs leading-relaxed">Abre el modal para agregar nuevas secciones a tu invitación</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── All Blocks ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4">Bloques disponibles</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">16 tipos de bloques</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Cada bloque es completamente personalizable. Combínalos para crear la invitación perfecta.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {BLOCKS.map(({ icon: Icon, name, desc, color, category }) => (
              <div key={name} className="group p-4 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all bg-white cursor-default">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-tight">{name}</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-semibold">{category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Presets / Templates ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-widest mb-4">Plantillas</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5">Empieza con una plantilla completa</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Las plantillas incluyen todos los bloques necesarios para tu tipo de evento, pre-configurados y listos para personalizar. Solo cambia el texto y las fotos.
              </p>
              <div className="space-y-3">
                {['Ahorra tiempo con bloques pre-configurados', 'Diseño coherente desde el primer momento', 'Personaliza cada detalle a tu gusto', 'Agrega o elimina bloques libremente'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <AddBlockMockup />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-12">
            {PRESETS.map(({ icon: Icon, name, blocks, color, desc }) => (
              <div key={name} className="group p-5 rounded-2xl bg-white border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-black text-gray-900 mb-1">{name}</p>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                  <Layers className="w-3 h-3" />
                  {blocks} bloques
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Keyboard Shortcuts ── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">Atajos y tips</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Trabaja más rápido</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Atajos de teclado y funciones avanzadas para usuarios que quieren más control.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIPS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-white">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm font-mono mb-1">{title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">FAQ</span>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <div key={i} className={`rounded-2xl border transition-all overflow-hidden ${openFaq === i ? 'border-violet-200 bg-violet-50/50' : 'border-gray-200 bg-white'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left">
                  <span className={`font-bold text-sm pr-4 ${openFaq === i ? 'text-violet-700' : 'text-gray-900'}`}>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-180 text-violet-600' : 'text-gray-400'}`} />
                </button>
                <div className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }}>
                  <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="relative rounded-[2.5rem] overflow-hidden p-12 text-center bg-gradient-to-br from-violet-600 to-pink-600">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">¿Listo para crear tu invitación?</h2>
              <p className="text-white/80 mb-8 text-lg">Empieza gratis. Sin tarjeta de crédito. En minutos.</p>
              <Link href="/login">
                <button className="inline-flex items-center gap-3 px-8 py-4 bg-white font-black text-violet-700 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg">
                  Crear mi invitación gratis
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center overflow-hidden">
              {appSettings.logo_url
                ? <img src={appSettings.logo_url} alt={appSettings.app_name} className="w-full h-full object-cover" />
                : <Sparkles className="w-4 h-4 text-white" />
              }
            </div>
            <span className="font-black text-white">{appSettings.app_name}</span>
          </Link>
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} {appSettings.app_name}. Todos los derechos reservados.</p>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
