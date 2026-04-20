'use client';
import { useMemo, useState } from 'react';
import { X, Search, CheckCircle2, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function CheckInMode({ open, onClose, guests = [], onChanged }) {
  const [search, setSearch] = useState('');
  const [working, setWorking] = useState(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    const onlyPending = guests.filter(g => !g.checked_in);
    if (!s) return [...onlyPending, ...guests.filter(g => g.checked_in)];
    return guests.filter(g =>
      g.name.toLowerCase().includes(s) ||
      g.id.toLowerCase().startsWith(s) ||
      (g.phone || '').includes(s)
    );
  }, [guests, search]);

  const checkedCount = guests.filter(g => g.checked_in).length;
  const total = guests.length;

  const toggle = async (guest) => {
    setWorking(guest.id);
    try {
      const { data } = await api.patch(`/guests/${guest.id}/check-in`, {
        checked_in: !guest.checked_in,
      });
      onChanged?.(data.data);
      toast({
        title: !guest.checked_in ? `✓ ${guest.name}` : `↺ ${guest.name}`,
        description: !guest.checked_in ? 'Check-in registrado' : 'Check-in revertido',
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message });
    } finally {
      setWorking(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between bg-gray-800 text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="font-semibold text-lg">Check-in en puerta</h2>
            <p className="text-sm text-gray-300">
              {checkedCount} / {total} invitados registrados
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-5 bg-gray-800 border-t border-gray-700">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <Input autoFocus
            placeholder="Buscar por nombre, teléfono o ID..."
            className="pl-11 h-12 bg-white text-base"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Sin resultados</p>
            </div>
          ) : filtered.map(g => (
            <button
              key={g.id}
              onClick={() => toggle(g)}
              disabled={working === g.id}
              className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all ${
                g.checked_in
                  ? 'bg-green-900/40 border border-green-700 hover:bg-green-900/60'
                  : 'bg-white hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                g.checked_in ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {g.checked_in ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-semibold">{(g.name?.[0] || '?').toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${g.checked_in ? 'text-white' : 'text-gray-900'}`}>{g.name}</p>
                <p className={`text-sm truncate ${g.checked_in ? 'text-green-200' : 'text-gray-500'}`}>
                  {g.group_name ? `${g.group_name} · ` : ''}
                  {g.party_size || 1} {(g.party_size || 1) > 1 ? 'pases' : 'pase'}
                  {g.checked_in && g.checked_in_at && ` · ${new Date(g.checked_in_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                g.checked_in ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {g.checked_in ? 'Dentro' : 'Marcar'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 px-5 py-3 border-t border-gray-700 flex justify-center">
        <Button variant="outline" size="sm" onClick={onClose} className="bg-white">
          Salir de modo check-in
        </Button>
      </div>
    </div>
  );
}
