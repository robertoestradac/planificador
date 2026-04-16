'use client';
import { getSectionConfig } from '../config/sectionTypes';
import ImageUpload from './ImageUpload';

export default function PropertiesPanel({ section, onUpdateProps }) {
  if (!section) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500 text-center">Selecciona una sección</p>
        <p className="text-xs text-gray-400 text-center mt-1">para editar sus propiedades</p>
      </div>
    );
  }

  const config = getSectionConfig(section.type);
  if (!config) return null;

  const handleChange = (fieldName, value) => {
    onUpdateProps(section.id, { ...section.props, [fieldName]: value });
  };

  const renderField = (field) => {
    const value = section.props[field.name] ?? (field.type === 'range' ? 0 : '');

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-shadow"
            placeholder={field.placeholder || field.label}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-shadow resize-none"
            rows={4}
            placeholder={field.label}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, parseInt(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
        );

      case 'range':
        return (
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={value}
              onChange={(e) => handleChange(field.name, parseInt(e.target.value))}
              min={field.min ?? 0}
              max={field.max ?? 100}
              className="flex-1 accent-violet-600 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-700 w-10 text-right tabular-nums">
              {value}{field.unit || ''}
            </span>
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-10 h-10 border-0 rounded-lg cursor-pointer p-0.5 border border-gray-200"
              />
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-mono"
              placeholder="#000000"
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none bg-white"
          >
            {field.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="sr-only"
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${value ? 'bg-violet-600' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900">{field.label}</span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
        );

      case 'image':
        return (
          <ImageUpload
            label=""
            value={value}
            onChange={(url) => handleChange(field.name, url)}
          />
        );

      case 'image-array':
        return (
          <div className="space-y-3">
            {/* Grid de imágenes existentes */}
            {Array.isArray(value) && value.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {value.map((url, i) => (
                  <div key={i} className="relative group/img">
                    <img src={url} alt="" className="w-full h-14 object-cover rounded-md border border-gray-200" />
                    <button
                      onClick={() => handleChange(field.name, value.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/img:opacity-100 rounded-md transition-opacity text-white text-xs font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <ImageUpload
              label="Agregar imagen"
              value=""
              onChange={(url) => {
                if (url) {
                  const current = Array.isArray(value) ? value : [];
                  handleChange(field.name, [...current, url]);
                }
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Agrupar fields por sección si tienen group definido
  const fields = config.fields;

  return (
    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <h2 className="text-sm font-semibold text-gray-900">{config.label}</h2>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 pl-4">Propiedades de la sección</p>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-5 pb-20">
        {fields.map((field) => (
          <div key={field.name}>
            {/* Label — no mostrar para checkbox (lo tiene integrado) */}
            {field.type !== 'checkbox' && (
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                {field.label}
                {field.required && <span className="text-red-400 ml-1 normal-case">*</span>}
              </label>
            )}
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
}
