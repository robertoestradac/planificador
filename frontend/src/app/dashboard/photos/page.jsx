'use client';
import { useEffect, useState, useCallback } from 'react';
import { Camera, Download, Trash2, X, ChevronLeft, ChevronRight, Loader2, ImageOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';
import { toast } from '@/hooks/use-toast';

export default function PhotosPage() {
  const [events, setEvents]         = useState([]);
  const [selectedEvent, setSelected] = useState(null);
  const [photos, setPhotos]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [lightbox, setLightbox]     = useState(null);
  const LIMIT = 20;

  // Load events
  useEffect(() => {
    dataCache.fetchers.events()
      .then(data => {
        setEvents(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch(() => toast({ variant: 'destructive', title: 'Error al cargar eventos' }))
      .finally(() => setLoadingEvents(false));
  }, []);

  // Load photos when event or page changes
  const fetchPhotos = useCallback(async (eventId, p = 1) => {
    if (!eventId) return;
    setLoadingPhotos(true);
    try {
      const { data } = await api.get(`/event-photos/by-event/${eventId}?page=${p}&limit=${LIMIT}`);
      setPhotos(data.data.photos || []);
      setTotal(data.data.total || 0);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar fotos' });
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setPage(1);
      fetchPhotos(selectedEvent.id, 1);
    }
  }, [selectedEvent, fetchPhotos]);

  const handleDelete = async (photoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await api.delete(`/event-photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setTotal(t => t - 1);
      if (lightbox !== null) setLightbox(null);
      toast({ title: 'Foto eliminada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    }
  };

  const handleDownload = async (photo) => {
    try {
      const res = await fetch(photo.photo_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename || `foto-${photo.id}.webp`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo descargar la foto' });
    }
  };

  const handleDownloadAll = async () => {
    if (!photos.length) return;
    for (const photo of photos) {
      await handleDownload(photo);
      // Small delay to avoid browser blocking multiple downloads
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fotos del evento</h1>
          <p className="text-gray-500 mt-1">Fotos subidas por tus invitados</p>
        </div>
        {photos.length > 0 && (
          <Button variant="outline" onClick={handleDownloadAll}>
            <Download className="w-4 h-4 mr-2" /> Descargar todas
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Event selector sidebar */}
        <div className="w-56 flex-shrink-0 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Eventos</p>
          {loadingEvents ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ))
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-400 px-2">No hay eventos</p>
          ) : (
            events.map(ev => (
              <button
                key={ev.id}
                onClick={() => setSelected(ev)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedEvent?.id === ev.id
                    ? 'bg-violet-50 text-violet-700 border border-violet-100'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="truncate block">{ev.name}</span>
              </button>
            ))
          )}
        </div>

        {/* Photos area */}
        <div className="flex-1 min-w-0">
          {!selectedEvent ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona un evento para ver sus fotos</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{selectedEvent.name}</CardTitle>
                <Badge variant="secondary">{total} foto{total !== 1 ? 's' : ''}</Badge>
              </CardHeader>
              <CardContent>
                {loadingPhotos ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  </div>
                ) : photos.length === 0 ? (
                  <div className="py-16 text-center">
                    <ImageOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Sin fotos aún</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Los invitados pueden subir fotos desde la invitación publicada
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {photos.map((photo, i) => (
                        <div
                          key={photo.id}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                          onClick={() => setLightbox(i)}
                        >
                          <img
                            src={photo.photo_url}
                            alt={photo.uploader_name || `Foto ${i + 1}`}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                            {photo.uploader_name && (
                              <p className="text-white text-xs px-2 py-1.5 truncate w-full
                                bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                {photo.uploader_name}
                              </p>
                            )}
                          </div>
                          {/* Action buttons */}
                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); handleDownload(photo); }}
                              className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5 text-gray-700" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(photo.id); }}
                              className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <span className="text-sm text-gray-400">
                          {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total} fotos
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" size="sm"
                            disabled={page === 1}
                            onClick={() => { const p = page - 1; setPage(p); fetchPhotos(selectedEvent.id, p); }}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-gray-500 min-w-[60px] text-center">
                            {page} / {totalPages}
                          </span>
                          <Button
                            variant="outline" size="sm"
                            disabled={page === totalPages}
                            onClick={() => { const p = page + 1; setPage(p); fetchPhotos(selectedEvent.id, p); }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(l => Math.max(0, l - 1)); }}
            className="absolute left-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <img
            src={photos[lightbox].photo_url}
            alt=""
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(l => Math.min(photos.length - 1, l + 1)); }}
            className="absolute right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Bottom info + actions */}
          <div
            className="absolute bottom-6 flex items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            {photos[lightbox].uploader_name && (
              <span className="text-white/80 text-sm flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> {photos[lightbox].uploader_name}
              </span>
            )}
            <span className="text-white/50 text-sm">{lightbox + 1} / {photos.length}</span>
            <button
              onClick={() => handleDownload(photos[lightbox])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Descargar
            </button>
            <button
              onClick={() => handleDelete(photos[lightbox].id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/70 hover:bg-red-500/90 text-white text-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
