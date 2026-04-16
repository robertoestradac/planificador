'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { getSectionConfig } from '../config/sectionTypes';
import ImageUpload from './ImageUpload';
import { DividerShape } from '../section-types/DividerSection';
import DynamicIcon from './DynamicIcon';
import IconPickerModal from './IconPickerModal';
import ImageEditorModal from './ImageEditorModal';
/* ── Field renderers ── */
function FieldRenderer({ field, value, onChange }) {
  const val = value ?? (field.type === 'range' || field.type === 'number' ? 0 : '');

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={val}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || field.label}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-shadow bg-gray-50 focus:bg-white"
        />
      );

    case 'textarea':
      return (
        <textarea
          value={val}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || field.label}
          rows={field.rows || 3}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none resize-y bg-gray-50 focus:bg-white"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={val}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
          min={field.min} max={field.max}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none bg-gray-50"
        />
      );

    case 'number-unit': {
      const match = String(val || '').match(/^(\d+(?:\.\d+)?)(.*)$/);
      const num = match ? match[1] : (val || 0);
      const unit = (match && match[2] ? match[2] : field.defaultUnit) || 'px';
      const availableUnits = field.units || ['px', '%', 'rem', 'em'];
      
      return (
        <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-pink-400">
           <input
             type="number"
             value={num}
             onChange={e => onChange(`${e.target.value}${unit}`)}
             className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none"
           />
           <select
             value={unit}
             onChange={e => onChange(`${num}${e.target.value}`)}
             className="bg-gray-100 border-l border-gray-200 text-sm px-2 text-gray-600 outline-none hover:bg-gray-200"
           >
             {availableUnits.map(u => (
               <option key={u} value={u}>{u}</option>
             ))}
           </select>
        </div>
      );
    }

    case 'range':
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            value={val}
            onChange={e => onChange(parseInt(e.target.value))}
            min={field.min ?? 0} max={field.max ?? 100}
            className="flex-1 accent-pink-500 cursor-pointer"
          />
          <span className="text-sm font-bold text-gray-700 w-10 text-right tabular-nums">
            {val}{field.unit || ''}
          </span>
        </div>
      );

    case 'color':
      return (
        <div className="flex items-center gap-2.5">
          <label className="relative cursor-pointer">
            <input
              type="color" value={val || '#000000'}
              onChange={e => onChange(e.target.value)}
              className="sr-only"
            />
            <div
              className="w-10 h-10 rounded-xl border-2 border-white shadow-md cursor-pointer ring-2 ring-gray-200 hover:ring-pink-300 transition-all"
              style={{ background: val || '#000000' }}
            />
          </label>
          <input
            type="text" value={val}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none font-mono bg-gray-50"
            placeholder="#000000"
          />
        </div>
      );

    case 'font':
      return (
        <select
          value={val || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 focus:bg-white transition-colors"
          style={{ fontFamily: val ? `"${val}", sans-serif` : 'inherit', fontSize: '15px' }}
        >
          {field.options.map((opt, i) => (
            <option key={i} value={opt} style={{ fontFamily: opt ? `"${opt}", sans-serif` : 'inherit' }}>
              {opt || 'Selecciona una tipografía'}
            </option>
          ))}
        </select>
      );

    case 'select':
      return (
        <select
          value={val}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none bg-gray-50"
        >
          {field.options.map(opt => {
            const isObj = typeof opt === 'object' && opt !== null;
            const value = isObj ? opt.value : opt;
            const label = isObj ? opt.label : (field.optionLabels?.[opt] ?? opt);
            return (
              <option key={value} value={value}>{label}</option>
            );
          })}
        </select>
      );

    case 'divider-select':
      return (
        <div className="grid grid-cols-2 gap-3 mb-2">
          {field.options.map((opt) => {
            const isObj = typeof opt === 'object' && opt !== null;
            const value = isObj ? opt.value : opt;
            const label = isObj ? opt.label : opt;
            const isSelected = val === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-pink-500 bg-pink-50/50 shadow-sm' : 'border-gray-100 hover:border-pink-200 bg-white hover:shadow-sm hover:scale-[1.02]'
                }`}
              >
                <div className="h-8 flex items-center justify-center w-full px-1 overflow-hidden">
                  <DividerShape style={value} color={isSelected ? '#ec4899' : '#9ca3af'} />
                </div>
                <span className={`text-[10px] uppercase tracking-wider mt-2 font-bold ${isSelected ? 'text-pink-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-gray-50">
          <div className="relative flex-shrink-0">
            <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} className="sr-only" />
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${val ? 'bg-gradient-to-r from-pink-500 to-violet-600' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 mt-0.5 ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700">{field.label}</span>
        </label>
      );

    case 'date':
      return (
        <input
          type="date" value={val}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none bg-gray-50"
        />
      );

    case 'image':
      return <ImageUpload label="" value={val} onChange={url => onChange(url)} />

    case 'image-editable':
      return null; // handled separately in the fields loop

    case 'image-array':
      return (
        <div className="space-y-3">
          {Array.isArray(val) && val.length > 0 && (
            <div className="space-y-4">
              {val.map((item, i) => {
                const url = typeof item === 'string' ? item : item.url;
                const caption = typeof item === 'string' ? '' : (item.caption || '');
                return (
                  <div key={i} className="flex gap-3 bg-white p-2 border border-gray-100 rounded-xl relative group pr-8 hover:border-pink-200 transition-colors">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                    <div className="flex-1 flex flex-col justify-center">
                      <input 
                        type="text" 
                        placeholder="Escribe un pie de foto..." 
                        value={caption}
                        onChange={e => {
                          const newVal = [...val];
                          newVal[i] = { url, caption: e.target.value };
                          onChange(newVal);
                        }}
                        className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-2 focus:ring-1 focus:ring-pink-400 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => onChange(val.filter((_, idx) => idx !== i))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-50 text-red-500 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <ImageUpload
            label="Añadir fotos"
            value=""
            multiple={true}
            onChange={urls => {
              if (!urls) return;
              const newUrls = Array.isArray(urls) ? urls.map(u => ({ url: u, caption: '' })) : [{ url: urls, caption: '' }];
              onChange([...(Array.isArray(val) ? val : []), ...newUrls]);
            }}
          />
        </div>
      );

    case 'color-array': {
      const colors = Array.isArray(val) ? val : [];
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div key={i} className="relative group">
                <label className="cursor-pointer">
                  <input
                    type="color" value={c || '#000000'}
                    onChange={e => {
                      const next = [...colors];
                      next[i] = e.target.value;
                      onChange(next);
                    }}
                    className="sr-only"
                  />
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-white shadow ring-1 ring-gray-200 hover:ring-pink-300 transition-all"
                    style={{ background: c }}
                  />
                </label>
                <button
                  onClick={() => onChange(colors.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                >✕</button>
              </div>
            ))}
            <button
              onClick={() => onChange([...colors, '#cccccc'])}
              className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 hover:border-pink-400 flex items-center justify-center text-gray-400 hover:text-pink-500 transition-colors text-lg"
            >+</button>
          </div>
        </div>
      );
    }

    case 'array-editor': {
      const items = Array.isArray(val) ? val : [];
      const shape = field.itemShape || {};
      const shapeKeys = Object.keys(shape);
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 relative group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">#{i + 1}</span>
                <button
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  className="w-5 h-5 bg-red-50 text-red-500 rounded flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
              </div>
              {shapeKeys.map(key => (
                <div key={key}>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{key}</label>
                  {shape[key] === 'number' ? (
                    <input
                      type="number"
                      value={item[key] ?? ''}
                      onChange={e => {
                        const next = [...items];
                        next[i] = { ...next[i], [key]: parseInt(e.target.value) || 0 };
                        onChange(next);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-pink-400 outline-none bg-white"
                    />
                  ) : shape[key] === 'icon' ? (
                    <IconField
                      value={item[key] ?? ''}
                      onChange={v => {
                        const next = [...items];
                        next[i] = { ...next[i], [key]: v };
                        onChange(next);
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={item[key] ?? ''}
                      onChange={e => {
                        const next = [...items];
                        next[i] = { ...next[i], [key]: e.target.value };
                        onChange(next);
                      }}
                      placeholder={key}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-pink-400 outline-none bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          <button
            onClick={() => {
              const empty = {};
              shapeKeys.forEach(k => { empty[k] = shape[k] === 'number' ? 0 : ''; });
              onChange([...items, empty]);
            }}
            className="w-full py-2 text-xs font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-xl border border-pink-200 transition-colors"
          >+ Agregar elemento</button>
        </div>
      );
    }

    case 'icon':
      return <IconField value={val} onChange={onChange} />;

    case 'icon-or-image':
      return <IconOrImageField value={val} onChange={onChange} />;

    case 'separator':
      return null; // rendered as label-only divider in the fields loop

    default:
      return null;
  }
}

function IconField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 hover:border-pink-300 hover:bg-pink-50/30 transition-colors text-left"
      >
        {value ? (
          <>
            <DynamicIcon name={value} size={20} className="text-pink-600" />
            <span className="font-mono text-gray-700">{value}</span>
          </>
        ) : (
          <span className="text-gray-400">Seleccionar icono...</span>
        )}
      </button>
      <IconPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        currentIcon={value}
      />
    </>
  );
}

const isImageUrl = (v) => v && (v.startsWith('http') || v.startsWith('/') || v.startsWith('data:'));

function IconOrImageField({ value, onChange }) {
  const [tab, setTab] = useState(() => isImageUrl(value) ? 'image' : 'icon');
  const [iconOpen, setIconOpen] = useState(false);

  const currentIsImage = isImageUrl(value);

  const handleTabChange = (t) => {
    setTab(t);
    onChange('');
  };

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {[
          { id: 'icon',  label: 'Icono' },
          { id: 'image', label: 'Imagen / SVG' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === t.id ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'icon' ? (
        <>
          <button
            type="button"
            onClick={() => setIconOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 hover:border-pink-300 hover:bg-pink-50/30 transition-colors text-left"
          >
            {(value && !currentIsImage) ? (
              <>
                <DynamicIcon name={value} size={20} className="text-pink-600" />
                <span className="font-mono text-gray-700">{value}</span>
              </>
            ) : (
              <span className="text-gray-400">Seleccionar icono...</span>
            )}
          </button>
          <IconPickerModal
            isOpen={iconOpen}
            onClose={() => setIconOpen(false)}
            onSelect={(v) => { onChange(v); setIconOpen(false); }}
            currentIcon={!currentIsImage ? value : ''}
          />
        </>
      ) : (
        <div className="space-y-2">
          <ImageUpload
            label=""
            value={currentIsImage ? value : ''}
            onChange={(url) => onChange(url || '')}
          />
          {currentIsImage && (
            <div className="flex items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <img src={value} alt="icono" className="max-h-16 object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ImageEditableField({ value, position, filterCSS, onChange, onAdjust }) {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="space-y-2">
      <ImageUpload label="" value={value} onChange={onChange} />
      {value && (
        <>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            Ajustar imagen (posición y filtros)
          </button>
          {(position && position !== '50% 50%' && position !== 'center center') && (
            <p className="text-[10px] text-violet-500 text-center font-medium">
              Focal: {position}
            </p>
          )}
        </>
      )}
      <ImageEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        imageUrl={value}
        position={position}
        filterCSS={filterCSS}
        onSave={onAdjust}
      />
    </div>
  );
}

export default function PropertiesDrawer({ section, onUpdateProps, onClose }) {
  if (!section) return null;

  const config = getSectionConfig(section.type);
  if (!config) return null;

  const handleChange = (fieldName, value) => {
    onUpdateProps(section.id, { ...section.props, [fieldName]: value });
  };

  const handleMultiChange = (updates) => {
    onUpdateProps(section.id, { ...section.props, ...updates });
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[150]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20" />

      {/* Drawer panel */}
      <div
        className="absolute top-0 bottom-0 right-0 w-80 sm:w-96 bg-white rounded-l-3xl shadow-2xl drawer-right-enter flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-500 to-violet-600" />
            <h3 className="text-base font-bold text-gray-900">{config.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Fields */}
        <div className="overflow-y-auto flex-1 custom-scrollbar p-5 pb-20">
          <div className="space-y-5">
            {config.fields.map(field => {
              // Conditional visibility
              if (field.showWhen) {
                const depVal = section.props[field.showWhen.field];
                if (field.showWhen.value !== undefined && depVal !== field.showWhen.value) return null;
                if (field.showWhen.not !== undefined && depVal === field.showWhen.not) return null;
              }

              // Separator renders as a styled divider heading
              if (field.type === 'separator') {
                return (
                  <div key={field.name} className="pt-4 pb-1 border-t-2 border-gray-100">
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">{field.label}</p>
                  </div>
                );
              }

              // image-editable: needs access to companion pos/filter fields
              if (field.type === 'image-editable') {
                const posKey    = `${field.name}Pos`;
                const filterKey = `${field.name}Filter`;
                return (
                  <div key={field.name}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {field.label}
                      {field.required && <span className="text-pink-500 ml-1 normal-case font-normal">*</span>}
                    </label>
                    <ImageEditableField
                      value={section.props[field.name]}
                      position={section.props[posKey]}
                      filterCSS={section.props[filterKey]}
                      onChange={url => handleChange(field.name, url)}
                      onAdjust={({ position, filterCSS }) =>
                        handleMultiChange({ [posKey]: position, [filterKey]: filterCSS })
                      }
                    />
                  </div>
                );
              }

              return (
                <div key={field.name}>
                  {field.type !== 'checkbox' && (
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {field.label}
                      {field.required && <span className="text-pink-500 ml-1 normal-case font-normal">*</span>}
                    </label>
                  )}
                  <FieldRenderer
                    field={field}
                    value={section.props[field.name]}
                    onChange={val => handleChange(field.name, val)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
