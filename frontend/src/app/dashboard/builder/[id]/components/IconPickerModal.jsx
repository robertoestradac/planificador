'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ICON_PACKS, loadPack } from './iconRegistry';

export default function IconPickerModal({ isOpen, onClose, onSelect, currentIcon }) {
  const [activePack, setActivePack] = useState('lu');
  const [search, setSearch] = useState('');
  const [iconNames, setIconNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedMod, setLoadedMod] = useState(null);
  const tabsRef = useRef(null);

  // Load pack icons when tab changes
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    loadPack(activePack).then(mod => {
      if (cancelled) return;
      const names = Object.keys(mod).filter(k => typeof mod[k] === 'function' && /^[A-Z]/.test(k));
      setIconNames(names);
      setLoadedMod(mod);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activePack, isOpen]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return iconNames.slice(0, 300);
    const q = search.toLowerCase();
    return iconNames.filter(n => n.toLowerCase().includes(q)).slice(0, 300);
  }, [iconNames, search]);

  const handleSelect = useCallback((name) => {
    onSelect(name);
    onClose();
  }, [onSelect, onClose]);

  // Reset search when switching packs
  const switchPack = useCallback((packId) => {
    setActivePack(packId);
    setSearch('');
  }, []);

  if (!isOpen) return null;

  const activePackInfo = ICON_PACKS.find(p => p.id === activePack);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-[680px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-800">Seleccionar Icono</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{ICON_PACKS.length} paquetes disponibles</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Pack tabs — horizontal scroll */}
        <div className="border-b border-gray-100">
          <div ref={tabsRef} className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {ICON_PACKS.map(pack => (
              <button
                key={pack.id}
                onClick={() => switchPack(pack.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activePack === pack.id
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pack.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder={`Buscar en ${activePackInfo?.name || ''}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-gray-400">
              {loading ? 'Cargando...' : `${filtered.length}${iconNames.length > 300 && !search ? '+' : ''} de ${iconNames.length} iconos`}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-[11px] text-pink-500 hover:underline">Limpiar</button>
            )}
          </div>
        </div>

        {/* Icon grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-10 gap-0.5">
              {filtered.map(name => {
                const Icon = loadedMod?.[name];
                if (!Icon) return null;
                const isSelected = name === currentIcon;
                return (
                  <button
                    key={name}
                    onClick={() => handleSelect(name)}
                    className={`flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer aspect-square ${
                      isSelected
                        ? 'bg-pink-100 text-pink-600 ring-2 ring-pink-400'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                    title={name}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm">No se encontraron iconos en {activePackInfo?.name}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          {currentIcon ? (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Seleccionado:</span>
                <span className="font-mono text-pink-600 bg-pink-50 px-2 py-0.5 rounded text-[11px]">{currentIcon}</span>
              </div>
              <button
                onClick={() => handleSelect('')}
                className="text-xs text-red-500 hover:text-red-700 hover:underline"
              >
                Quitar icono
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400">Haz clic en un icono para seleccionarlo</p>
          )}
        </div>
      </div>
    </div>
  );
}
