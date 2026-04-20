'use client';
import { X, Copy, Download, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { buildQrUrl, buildWhatsAppUrl, defaultWhatsAppMessage } from './utils';

export default function QRModal({ open, onClose, guest, link, eventTitle, onMarkSent }) {
  if (!open || !guest) return null;

  const qrUrl = buildQrUrl(link, 300);
  const waUrl = buildWhatsAppUrl(guest.phone, defaultWhatsAppMessage({
    name: guest.name, eventTitle, link,
  }));

  const copy = async () => {
    try { 
      await navigator.clipboard.writeText(link); 
      toast({ title: 'Link copiado' }); 
      if (onMarkSent) onMarkSent(guest);
    }
    catch { toast({ variant: 'destructive', title: 'No se pudo copiar' }); }
  };

  const handleWhatsAppClick = () => {
    if (onMarkSent) onMarkSent(guest);
  };

  const downloadQr = () => {
    // Open print-friendly QR in a new tab for download/print
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <!doctype html><html><head><title>QR ${guest.name}</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;flex-direction:column;gap:20px}h1{font-size:20px;margin:0}p{margin:0;color:#666}</style>
      </head><body>
      <h1>${guest.name}</h1>
      <img src="${buildQrUrl(link, 400)}" alt="QR" />
      <p>${link}</p>
      <script>setTimeout(()=>window.print(),400)</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">Link de RSVP</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="font-medium text-gray-900">{guest.name}</p>
            {guest.group_name && <p className="text-xs text-gray-500">{guest.group_name}</p>}
          </div>

          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR del invitado" width={240} height={240}
                 className="border rounded-lg p-2 bg-white" />
          </div>

          <div className="bg-gray-50 border rounded p-2 text-xs font-mono break-all text-gray-700">
            {link}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="w-4 h-4 mr-1" /> Copiar
            </Button>
            <a href={waUrl} target="_blank" rel="noreferrer" className="block" onClick={handleWhatsAppClick}>
              <Button type="button" variant="outline" size="sm" className="w-full text-green-700">
                <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={downloadQr}>
              <Download className="w-4 h-4 mr-1" /> Imprimir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
