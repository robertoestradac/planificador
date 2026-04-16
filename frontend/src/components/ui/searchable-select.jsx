'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SearchableSelect — combobox sin dependencias externas, compatible con Next.js SSR.
 * El dropdown se renderiza vía portal (position:fixed) para nunca ser clipeado
 * por parents con overflow:hidden / overflow:auto.
 *
 * Props:
 *  options           — [{ value, label, sublabel?, ...rest }]
 *  value             — string | null
 *  onChange          — (value | null) => void
 *  placeholder       — string
 *  searchPlaceholder — string
 *  renderOption      — ({ option, isSelected, isHighlighted }) => JSX
 *  renderValue       — (option) => JSX
 *  noOptionsText     — string
 *  isLoading         — bool
 *  disabled          — bool
 *  className         — string
 */
export default function SearchableSelect({
  options = [],
  value = null,
  onChange,
  placeholder = 'Selecciona...',
  searchPlaceholder = 'Buscar...',
  renderOption,
  renderValue,
  noOptionsText = 'Sin resultados',
  disabled = false,
  isLoading = false,
  className,
}) {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [highlighted, setHigh]  = useState(-1);
  const [dropPos, setDropPos]   = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted]   = useState(false);

  const controlRef = useRef(null);
  const inputRef   = useRef(null);
  const listRef    = useRef(null);
  const dropRef    = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const selected = options.find(o => o.value === value) || null;

  const filtered = options.filter(o =>
    !query ||
    String(o.label).toLowerCase().includes(query.toLowerCase()) ||
    String(o.sublabel ?? '').toLowerCase().includes(query.toLowerCase())
  );

  /* ── position dropdown under control ── */
  const calcPos = useCallback(() => {
    if (!controlRef.current) return;
    const r = controlRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const dropH = Math.min(280, 52 + filtered.length * 48 + 36);
    const openUp = spaceBelow < dropH + 8 && r.top > dropH + 8;
    setDropPos({
      top:   openUp ? r.top - dropH - 4 : r.bottom + 4,
      left:  r.left,
      width: r.width,
      openUp,
    });
  }, [filtered.length]);

  /* ── open/close ── */
  const handleOpen = () => {
    if (disabled) return;
    calcPos();
    setOpen(true);
    setQuery('');
    setHigh(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /* ── reposition on scroll / resize while open ── */
  useEffect(() => {
    if (!open) return;
    const update = () => calcPos();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, calcPos]);

  /* ── close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        controlRef.current && !controlRef.current.contains(e.target) &&
        dropRef.current    && !dropRef.current.contains(e.target)
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => { setHigh(-1); }, [query]);

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      listRef.current.children[highlighted]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const select = useCallback((option) => {
    onChange?.(option?.value ?? null);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const clear = (e) => {
    e.stopPropagation();
    onChange?.(null);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHigh(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setHigh(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter')     { e.preventDefault(); if (highlighted >= 0 && filtered[highlighted]) select(filtered[highlighted]); }
    else if (e.key === 'Escape')    { setOpen(false); setQuery(''); }
  };

  /* ── default renderers ── */
  const defaultOption = ({ option, isSelected, isHighlighted }) => (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer select-none transition-colors',
      isSelected ? 'bg-violet-600 text-white' : isHighlighted ? 'bg-violet-50 text-gray-900' : 'text-gray-900 hover:bg-gray-50',
    )}>
      <span className="text-sm font-medium truncate">{option.label}</span>
      {option.sublabel && (
        <span className={cn('text-xs font-mono ml-auto flex-shrink-0', isSelected ? 'text-violet-200' : 'text-gray-400')}>
          {option.sublabel}
        </span>
      )}
    </div>
  );

  const defaultValue = (opt) => (
    <span className="text-sm text-gray-900 truncate">{opt.label}</span>
  );

  const renderOpt = renderOption || defaultOption;
  const renderVal = renderValue  || defaultValue;

  /* ── dropdown portal ── */
  const Dropdown = mounted ? createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={searchPlaceholder}
          className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
        />
        {query && (
          <button type="button" onMouseDown={e => { e.preventDefault(); setQuery(''); }}
            className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <ul ref={listRef} className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
        {isLoading ? (
          <li className="py-6 text-center text-sm text-gray-400">Cargando...</li>
        ) : filtered.length === 0 ? (
          <li className="py-6 text-center text-sm text-gray-400">{noOptionsText}</li>
        ) : (
          filtered.map((opt, i) => (
            <li key={opt.value} onMouseDown={(e) => { e.preventDefault(); select(opt); }} onMouseEnter={() => setHigh(i)}>
              {renderOpt({ option: opt, isSelected: opt.value === value, isHighlighted: i === highlighted })}
            </li>
          ))
        )}
      </ul>

      {filtered.length > 0 && (
        <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className={cn('relative', className)}>
      {/* ── Control button ── */}
      <button
        ref={controlRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-2 h-10 px-3 rounded-lg border text-left transition-all bg-white',
          open  ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-gray-200 hover:border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
        )}
      >
        <span className="flex-1 min-w-0 flex items-center">
          {isLoading
            ? <span className="text-sm text-gray-400">Cargando...</span>
            : selected
              ? renderVal(selected)
              : <span className="text-sm text-gray-400">{placeholder}</span>
          }
        </span>
        <span className="flex items-center gap-0.5 flex-shrink-0">
          {selected && !disabled && (
            <span role="button" onMouseDown={clear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-150', open && 'rotate-180')} />
        </span>
      </button>

      {open && Dropdown}
    </div>
  );
}
