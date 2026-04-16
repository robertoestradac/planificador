'use client';
import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { getAllSectionTypes } from '../config/sectionTypes';
import { getTemplatesForSection } from '../config/unifiedTemplates';
import * as Icons from 'lucide-react';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

function DraggableBlock({ type, label, icon, description, onClick, isExpanded, hasChildren }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${type}`,
    data: { type, isNew: true },
  });

  const IconComponent = Icons[icon] || Icons.Box;

  return (
    <div
      ref={setNodeRef}
      className={`relative bg-white border rounded-lg transition-all ${
        isDragging ? 'opacity-50 ring-2 ring-violet-500' : 'border-gray-200 hover:border-violet-300'
      } ${isExpanded ? 'ring-1 ring-violet-500 border-violet-500' : ''}`}
    >
      <div className="flex items-center p-3">
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mr-2"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Content - Click to expand if has children */}
        <div 
          className={`flex-1 flex items-center gap-3 cursor-pointer ${hasChildren ? '' : 'cursor-default'}`}
          onClick={hasChildren ? onClick : undefined}
        >
          <div className={`p-2 rounded-md ${isExpanded ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className={`font-semibold text-sm ${isExpanded ? 'text-violet-700' : 'text-gray-800'}`}>
              {label}
            </span>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{description}</p>
          </div>
          
          {hasChildren && (
            <div className="text-gray-400">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DraggableTemplate({ template, type }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: { 
      type: type,
      isNew: true,
      isTemplate: true,
      templateProps: template.props,
    },
  });

  // Extract preview styles safely
  const bg = template.props.backgroundColor || '#ffffff';
  const color = template.props.textColor || '#000000';
  const title = template.props.title || template.name;
  const subtitle = template.props.subtitle || '';
  const bgImage = template.props.backgroundImage || '';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group relative overflow-hidden rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 ring-2 ring-violet-500' : 'border-gray-200 hover:border-violet-300'
      }`}
    >
      {/* Preview Area */}
      <div 
        className="h-20 w-full flex flex-col items-center justify-center p-2 relative"
        style={{ 
          backgroundColor: bg,
          color: color
        }}
      >
        {/* Background Image Overlay if exists */}
        {bgImage && (
           <div 
             className="absolute inset-0 opacity-50 bg-cover bg-center"
             style={{ backgroundImage: `url(${bgImage})` }}
           />
        )}
        
        <div className="relative z-10 text-center w-full overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-wider truncate px-2 opacity-90">
            {title}
          </p>
          {subtitle && (
            <p className="text-[9px] truncate px-2 opacity-75 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-white px-2 py-1.5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-600 truncate max-w-[80%]">
          {template.name}
        </span>
        <span className="text-xs">{template.thumbnail}</span>
      </div>
    </div>
  );
}

export default function SidebarBlocks() {
  const sectionTypes = getAllSectionTypes();
  // State to track which block type is expanded
  const [expandedBlock, setExpandedBlock] = useState(null);
  // State to track which category inside a block is expanded
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleBlock = (blockId) => {
    setExpandedBlock(prev => prev === blockId ? null : blockId);
    // Reset categories when switching blocks
    if (expandedBlock !== blockId) {
      setExpandedCategories({});
    }
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Bloques</h2>
        <p className="text-xs text-gray-500 mt-1">Arrastra para agregar al canvas</p>
      </div>
      
      <div className="p-4 space-y-3 pb-20">
        {sectionTypes.map((type) => {
          // Get templates for this section type
          const templates = getTemplatesForSection(type.id);
          const hasTemplates = templates.length > 0;
          const isBlockExpanded = expandedBlock === type.id;

          return (
            <div key={type.id} className="space-y-2">
              <DraggableBlock
                type={type.id}
                label={type.label}
                icon={type.icon}
                description={type.description}
                onClick={() => hasTemplates && toggleBlock(type.id)}
                isExpanded={isBlockExpanded}
                hasChildren={hasTemplates}
              />
              
              {/* Templates Cascading Menu */}
              {isBlockExpanded && hasTemplates && (
                <div className="ml-4 pl-4 border-l-2 border-violet-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Plantillas
                  </p>
                  {templates.map((category) => {
                    const CategoryIcon = Icons[category.icon] || Icons.Layout;
                    const isCategoryExpanded = expandedCategories[category.category];

                    return (
                      <div key={category.category} className="bg-white rounded-md border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category.category)}
                          className={`w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors ${isCategoryExpanded ? 'bg-gray-50' : ''}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <CategoryIcon className={`w-4 h-4 ${isCategoryExpanded ? 'text-violet-600' : 'text-gray-400'}`} />
                            <span className={`text-xs font-medium ${isCategoryExpanded ? 'text-gray-900' : 'text-gray-600'}`}>
                              {category.category}
                            </span>
                          </div>
                          {isCategoryExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                        
                        {isCategoryExpanded && (
                          <div className="p-2 bg-gray-50 grid grid-cols-2 gap-2 border-t border-gray-100">
                            {category.templates.map((template) => (
                              <DraggableTemplate
                                key={template.id}
                                template={template}
                                type={type.id}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
