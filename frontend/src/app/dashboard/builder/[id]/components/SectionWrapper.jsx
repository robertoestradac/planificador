'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, Trash2, GripVertical, ChevronUp, ChevronDown, Copy } from 'lucide-react';

export default function SectionWrapper({
  section, children, isSelected,
  onSelect, onDelete, onDuplicate, onOpenSettings,
  onMoveUp, onMoveDown, canMoveUp, canMoveDown,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group section-hover-ring ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(section.id)}
    >
      {/* ── Controls bar (aparece en hover) ── */}
      <div className={`
        absolute top-0 left-0 right-0 z-40
        flex items-center justify-between px-2 py-1
        transition-all duration-150
        ${isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
        ${isSelected ? '!opacity-100' : ''}
      `}>
        {/* Left: drag + move */}
        <div className="flex items-center gap-0.5">
          <button
            {...attributes} {...listeners}
            className="w-6 h-6 rounded-md bg-gray-900/80 text-white flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-700 transition-colors"
            onClick={e => e.stopPropagation()}
            title="Arrastrar"
          >
            <GripVertical className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMoveUp(section.id); }}
            disabled={!canMoveUp}
            className="w-6 h-6 rounded-md bg-gray-900/80 text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
            title="Subir"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMoveDown(section.id); }}
            disabled={!canMoveDown}
            className="w-6 h-6 rounded-md bg-gray-900/80 text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
            title="Bajar"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Right: settings + duplicate + delete */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={e => { e.stopPropagation(); onOpenSettings(section.id); }}
            className="w-6 h-6 rounded-md bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors"
            title="Editar propiedades"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDuplicate(section.id); }}
            className="w-6 h-6 rounded-md bg-gray-900/80 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
            title="Duplicar"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(section.id); }}
            className="w-6 h-6 rounded-md bg-gray-900/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
