'use client';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmDialog({ open, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 text-center space-y-3">
          {danger && <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>}
          <h3 className="text-base font-semibold">{title}</h3>
          {message && <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>{cancelText}</Button>
            <Button
              className={`flex-1 ${danger ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={() => { onConfirm?.(); onClose?.(); }}
            >{confirmText}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
