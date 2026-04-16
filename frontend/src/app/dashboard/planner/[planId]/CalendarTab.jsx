'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarTab({ planId }) {
  const [entries, setEntries]         = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD string
  const [showPanel, setShowPanel]     = useState(false);
  const [showForm, setShowForm]       = useState(false); // true = add/edit form visible
  const [editId, setEditId]           = useState(null);  // null = new entry, uuid = editing
  const [form, setForm]               = useState({ title: '', type: 'nota', description: '', date: '' });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/planner/${planId}/calendar`);
      setEntries(data.data || []);
    } catch {
      // silently ignore
    }
  }, [planId]);

  useEffect(() => { load(); }, [load, currentMonth]);

  // Build calendar grid
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const entriesByDate = entries.reduce((acc, e) => {
    const key = e.date?.slice(0, 10);
    if (!key) return acc;
    (acc[key] = acc[key] || []).push(e);
    return acc;
  }, {});

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const openDay = (day) => {
    const dateStr = formatDate(new Date(year, month, day));
    setSelectedDate(dateStr);
    setShowPanel(true);
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', type: 'nota', description: '', date: dateStr });
    setError(null);
  };

  const closePanel = () => {
    setShowPanel(false);
    setShowForm(false);
    setSelectedDate(null);
    setEditId(null);
    setError(null);
  };

  const startEdit = (entry) => {
    setEditId(entry.id);
    setShowForm(true);
    setForm({
      title: entry.title,
      type: entry.type,
      description: entry.description || '',
      date: entry.date?.slice(0, 10) || selectedDate,
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setShowForm(false);
    setForm({ title: '', type: 'nota', description: '', date: selectedDate || '' });
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('El título es requerido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        // editId is a real UUID — update existing
        const { data } = await api.put(`/planner/${planId}/calendar/${editId}`, form);
        setEntries(prev => prev.map(en => en.id === editId ? data.data : en));
        toast({ title: 'Entrada actualizada' });
      } else {
        // editId is null — create new
        const { data } = await api.post(`/planner/${planId}/calendar`, form);
        setEntries(prev => [...prev, data.data]);
        toast({ title: 'Entrada creada' });
      }
      setEditId(null);
      setShowForm(false);
      setForm({ title: '', type: 'nota', description: '', date: selectedDate || '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta entrada?')) return;
    try {
      await api.delete(`/planner/${planId}/calendar/${id}`);
      setEntries(prev => prev.filter(en => en.id !== id));
      toast({ title: 'Entrada eliminada' });
    } catch {
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  const dayEntries = selectedDate ? (entriesByDate[selectedDate] || []) : [];

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {DAY_NAMES.map(d => (
          <div key={d} className="bg-gray-50 text-center text-xs font-semibold text-gray-500 py-2">
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-white min-h-[64px]" />;
          const dateStr = formatDate(new Date(year, month, day));
          const dayEnts = entriesByDate[dateStr] || [];
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === formatDate(new Date());
          return (
            <div
              key={dateStr}
              onClick={() => openDay(day)}
              className={`bg-white min-h-[64px] p-1.5 cursor-pointer hover:bg-violet-50 transition-colors ${isSelected ? 'ring-2 ring-inset ring-violet-500' : ''}`}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${isToday ? 'bg-violet-600 text-white' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {dayEnts.map(en => (
                  <span
                    key={en.id}
                    className={`w-2 h-2 rounded-full ${en.type === 'alerta' ? 'bg-red-500' : 'bg-violet-500'}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-in panel */}
      {showPanel && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={closePanel}>
          <div
            className="relative w-full max-w-sm bg-white shadow-2xl h-full overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{selectedDate}</h3>
              <button onClick={closePanel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Entry list */}
              {dayEntries.length === 0 && !editId && (
                <p className="text-sm text-gray-400 text-center py-4">Sin entradas para este día</p>
              )}
              {dayEntries.map(en => (
                <div key={en.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${en.type === 'alerta' ? 'bg-red-100 text-red-700' : 'bg-violet-100 text-violet-700'}`}>
                          {en.type}
                        </span>
                        <p className="text-sm font-medium text-gray-900 truncate">{en.title}</p>
                      </div>
                      {en.description && <p className="text-xs text-gray-500">{en.description}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(en)} className="p-1 text-gray-400 hover:text-violet-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(en.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add/Edit form */}
              {!showForm && (
                <button
                  onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', type: 'nota', description: '', date: selectedDate }); }}
                  className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium"
                >
                  <Plus className="w-4 h-4" /> Agregar entrada
                </button>
              )}

              {showForm && (
                <form onSubmit={handleSave} className="space-y-3 border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700">{editId ? 'Editar entrada' : 'Nueva entrada'}</h4>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Título *</label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Título de la entrada"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Tipo</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="nota">Nota</option>
                      <option value="alerta">Alerta</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Descripción</label>
                    <textarea
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px] resize-none"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Descripción opcional"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Fecha</label>
                    <input
                      type="date"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 h-9 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Guardando...' : (editId ? 'Actualizar' : 'Agregar')}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 h-9 rounded-md border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
