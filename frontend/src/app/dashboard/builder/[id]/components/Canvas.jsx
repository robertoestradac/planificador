'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SectionWrapper from './SectionWrapper';
import LazySection from './LazySection';
import { getSectionComponent } from '../section-types';
import { getSectionBgStyle, getBodyBgStyle } from '../utils/bgStyles';
import { Smartphone } from 'lucide-react';

const WIDTHS = {
  desktop: '100%',
  tablet:  '768px',
  mobile:  '390px',
};

export default function Canvas({
  sections, selectedSectionId, onSelectSection,
  onDeleteSection, onDuplicateSection,
  onMoveUp, onMoveDown, onOpenSettings,
  viewMode, globalTheme,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-droppable' });
  const width = WIDTHS[viewMode] || '100%';

  const containerStyle = {
    fontFamily: globalTheme?.fontFamily ? `"${globalTheme.fontFamily}", serif` : undefined,
    '--theme-primary':    globalTheme?.primary    || '#FF4D8F',
    '--theme-secondary':  globalTheme?.secondary  || '#7c3aed',
    '--theme-background': globalTheme?.background || '#ffffff',
    '--theme-text':       globalTheme?.text       || '#1a1a2e',
    '--theme-font':       globalTheme?.fontFamily ? `"${globalTheme.fontFamily}", serif` : 'inherit',
  };

  return (
    <div
      ref={setNodeRef}
      className="flex-1 overflow-y-auto custom-scrollbar builder-bg relative"
      data-canvas-scroll="true"
      style={{ paddingBottom: '120px' /* espacio para toolbar */ }}
      onClick={e => { if (e.target === e.currentTarget) onSelectSection(null); }}
    >
      {/* Drop indicator */}
      {isOver && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-pink-500 to-violet-600 animate-pulse" />
      )}

      {/* Centered canvas */}
      <div className="flex justify-center py-8 px-4 min-h-full">
        <div
          style={{ width, maxWidth: '100%', ...containerStyle }}
          className="transition-all duration-300"
        >
          {/* Phone frame for mobile view */}
          {viewMode === 'mobile' ? (
            <div className="phone-frame overflow-hidden" style={getBodyBgStyle(globalTheme)}>
              {/* Phone notch */}
              <div className="phone-frame-notch" />

              {sections.length === 0 ? (
                <EmptyCanvas isOver={isOver} />
              ) : (
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="relative">
                    {sections.map((section, index) => (
                      <SectionItem
                        key={section.id}
                        section={section}
                        index={index}
                        total={sections.length}
                        selectedSectionId={selectedSectionId}
                        onSelectSection={onSelectSection}
                        onDeleteSection={onDeleteSection}
                        onDuplicateSection={onDuplicateSection}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onOpenSettings={onOpenSettings}
                        globalTheme={globalTheme}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          ) : (
            /* Desktop/Tablet view */
            <div className={`shadow-2xl ${isOver ? 'ring-4 ring-pink-400 ring-offset-4' : ''} transition-all`} style={getBodyBgStyle(globalTheme)}>
              {sections.length === 0 ? (
                <EmptyCanvas isOver={isOver} />
              ) : (
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="pt-8 relative">
                    {sections.map((section, index) => (
                      <SectionItem
                        key={section.id}
                        section={section}
                        index={index}
                        total={sections.length}
                        selectedSectionId={selectedSectionId}
                        onSelectSection={onSelectSection}
                        onDeleteSection={onDeleteSection}
                        onDuplicateSection={onDuplicateSection}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onOpenSettings={onOpenSettings}
                        globalTheme={globalTheme}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          )}

          {/* Section count */}
          {sections.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-4">
              {sections.length} sección{sections.length !== 1 ? 'es' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionItem({ section, index, total, selectedSectionId, onSelectSection, onDeleteSection, onDuplicateSection, onMoveUp, onMoveDown, onOpenSettings, globalTheme }) {
  const SectionComponent = getSectionComponent(section.type);
  if (!SectionComponent) return (
    <div className="p-4 bg-red-50 border border-red-200 text-red-500 text-xs">
      Tipo desconocido: {section.type}
    </div>
  );

  const themeFont = globalTheme?.fontFamily ? `"${globalTheme.fontFamily}", serif` : 'inherit';
  const bgStyle = getSectionBgStyle(section.props);

  return (
    <SectionWrapper
      section={section}
      isSelected={selectedSectionId === section.id}
      onSelect={onSelectSection}
      onDelete={onDeleteSection}
      onDuplicate={onDuplicateSection}
      onOpenSettings={onOpenSettings}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      canMoveUp={index > 0}
      canMoveDown={index < total - 1}
    >
      <LazySection minHeight={80}>
        <div 
          className="section-typography-wrapper"
          style={{ 
            '--title-font': section.props?.titleFont ? `"${section.props.titleFont}", serif` : themeFont,
            '--text-font': section.props?.textFont ? `"${section.props.textFont}", sans-serif` : themeFont,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {bgStyle && <div style={bgStyle} />}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <SectionComponent props={section.props} />
          </div>
        </div>
      </LazySection>
    </SectionWrapper>
  );
}

function EmptyCanvas({ isOver }) {
  return (
    <div className={`flex flex-col items-center justify-center py-24 px-8 transition-colors ${isOver ? 'bg-pink-50' : 'bg-white'}`}>
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 transition-colors ${
        isOver ? 'bg-pink-500' : 'bg-gradient-to-br from-pink-100 to-violet-100'
      }`}>
        <Smartphone className={`w-9 h-9 ${isOver ? 'text-white' : 'text-pink-400'}`} />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isOver ? 'text-pink-600' : 'text-gray-700'}`}>
        {isOver ? '¡Suelta aquí!' : 'Tu invitación está vacía'}
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Usa el botón <span className="font-semibold text-pink-500">+ Añadir bloque</span> para comenzar a diseñar
      </p>
    </div>
  );
}
