'use client';
import { useState, useRef, useCallback } from 'react';
import { X, Move, Sun, Contrast, Droplets, RotateCcw, Check } from 'lucide-react';

/* ── Helpers ── */
function parsePosition(pos) {
  if (!pos || pos === 'center' || pos === 'center center') return { x: 50, y: 50 };
  const parts = String(pos).replace(/%/g, '').split(/\s+/);
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1] ?? parts[0]);
  return {
    x: isNaN(x) ? 50 : Math.round(x),
    y: isNaN(y) ? 50 : Math.round(y),
  };
}

function parseFilter(css, prop) {
  if (!css) return 100;
  const m = css.match(new RegExp(`${prop}\\((\\d+(?:\\.\\d+)?)%\\)`));
  return m ? Math.round(parseFloat(m[1])) : 100;
}

function buildFilter(b, c, s) {
  if (b === 100 && c === 100 && s === 100) return '';
  return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
}

export default function ImageEditorModal({ isOpen, onClose, imageUrl, position, filterCSS, onSave }) {
  const [pos,        setPos]        = useState(() => parsePosition(position));
  const [brightness, setBrightness] = useState(() => parseFilter(filterCSS, 'brightness'));
  const [contrast,   setContrast]   = useState(() => parseFilter(filterCSS, 'contrast'));
  const [saturation, setSaturation] = useState(() => parseFilter(filterCSS, 'saturate'));
  const containerRef = useRef(null);
  const isDragging   = useRef(false);

  const updatePosFromEvent = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width)  * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((clientY - rect.top)  / rect.height) * 100)));
    setPos({ x, y });
  }, []);

  const onMouseDown = (e) => { isDragging.current = true; updatePosFromEvent(e); };
  const onMouseMove = (e) => { if (isDragging.current) updatePosFromEvent(e); };
  const onMouseUp   = ()  => { isDragging.current = false; };

  const handleReset = () => {
    setPos({ x: 50, y: 50 });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleSave = () => {
    onSave({
      position:  `${pos.x}% ${pos.y}%`,
      filterCSS: buildFilter(brightness, contrast, saturation),
    });
    onClose();
  };

  const previewFilter = buildFilter(brightness, contrast, saturation) || 'none';

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Ajustar imagen</h3>
            <p className="text-xs text-gray-400 mt-0.5">Haz clic para fijar el punto focal · Ajusta filtros</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Focal point picker */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Move className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Punto focal</span>
              <span className="ml-auto text-xs text-gray-400 tabular-nums">{pos.x}% {pos.y}%</span>
            </div>
            <div
              ref={containerRef}
              className="relative w-full rounded-2xl overflow-hidden cursor-crosshair select-none"
              style={{ paddingBottom: '60%', background: '#000' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={onMouseUp}
            >
              {/* Preview image */}
              <img
                src={imageUrl}
                alt="preview"
                draggable={false}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: `${pos.x}% ${pos.y}%`,
                  filter: previewFilter,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
              {/* Grid overlay */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '33.33% 33.33%',
              }} />
              {/* Focal dot */}
              <div style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}>
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-lg bg-pink-500/60 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              {/* Instruction */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none whitespace-nowrap">
                Haz clic o arrastra para mover el punto focal
              </div>
            </div>
          </div>

          {/* Filter sliders */}
          <div className="space-y-4">
            <FilterSlider
              icon={<Sun className="w-3.5 h-3.5 text-yellow-500" />}
              label="Brillo"
              value={brightness}
              onChange={setBrightness}
              min={30} max={200}
              default100
            />
            <FilterSlider
              icon={<Contrast className="w-3.5 h-3.5 text-violet-500" />}
              label="Contraste"
              value={contrast}
              onChange={setContrast}
              min={30} max={200}
              default100
            />
            <FilterSlider
              icon={<Droplets className="w-3.5 h-3.5 text-blue-400" />}
              label="Saturación"
              value={saturation}
              onChange={setSaturation}
              min={0} max={200}
              default100
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 rounded-xl shadow transition-all"
          >
            <Check className="w-4 h-4" />
            Aplicar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSlider({ icon, label, value, onChange, min, max }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex-1">{label}</span>
        <span className="text-xs font-mono text-gray-600 w-8 text-right">{value}%</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min} max={max}
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-pink-500"
          style={{ background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)` }}
        />
      </div>
    </div>
  );
}
