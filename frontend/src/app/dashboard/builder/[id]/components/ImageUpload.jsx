'use client';
import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function ImageUpload({ value, onChange, label, multiple = false }) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) return null;
        
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        return data.success ? data.data.url : null;
      });

      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter(url => url !== null);
      
      if (validUrls.length > 0) {
        if (multiple) {
          onChange(validUrls);
        } else {
          onChange(validUrls[0]);
        }
        toast({ title: multiple && validUrls.length > 1 ? `${validUrls.length} imágenes subidas` : 'Imagen subida exitosamente' });
      } else if (results.length > 0) {
         toast({ variant: 'destructive', title: 'Error', description: 'Por favor sube archivos de imagen válidos.' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir',
        description: 'No se pudo subir la imagen. Intenta de nuevo.',
      });
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      
      {value && !multiple ? (
        <div className="relative group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 aspect-video flex-shrink-0">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          <button
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Eliminar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors aspect-video flex-shrink-0
            ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400 hover:bg-gray-50'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400 mb-2 group-hover:text-pink-500 transition-colors" />
          )}
          <p className="text-xs text-center text-gray-500 max-w-[150px]">
            {uploading ? 'Subiendo...' : (multiple ? 'Haz clic o arrastra múltiples imágenes' : 'Haz clic o arrastra para subir')}
          </p>
          {multiple ? (
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onClick={(e) => e.target.value = null}
              onChange={(e) => handleFiles(e.target.files)}
            />
          ) : (
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onClick={(e) => e.target.value = null}
              onChange={(e) => handleFiles(e.target.files)}
            />
          )}
        </div>
      )}
    </div>
  );
}
