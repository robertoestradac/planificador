'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';

export default function AlertBadge() {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen]     = useState(false);

  useEffect(() => {
    api.get('/dashboard/alerts')
      .then(({ data }) => setAlerts(data.data || []))
      .catch(() => setAlerts([]));
  }, []);

  if (alerts.length === 0) return null;

  const dismiss = async (id) => {
    try {
      await api.put(`/dashboard/alerts/${id}/dismiss`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch { /* silently ignore */ }
  };

  return (
    <div className="relative">
      <span
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        className="absolute top-1 right-1 z-10 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold cursor-pointer select-none"
      >
        {alerts.length > 9 ? '9+' : alerts.length}
      </span>

      {open && (
        <div
          className="fixed z-50 top-16 left-64 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Alertas activas</p>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {alerts.map(alert => (
              <div key={alert.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                    {alert.date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(alert.date).toLocaleDateString('es-GT')}
                      </p>
                    )}
                    {alert.description && (
                      <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(alert.id)}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Descartar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
