'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, splitPhone, joinPhone } from './countryCodes';

const emptyForm = {
  name: '',
  phoneCode: DEFAULT_COUNTRY_CODE,
  phoneNumber: '',
  email: '',
  party_size: 1,
  group_name: '',
  dietary_restrictions: '',
  notes: '',
};

export default function GuestFormModal({ open, onClose, invitationId, guest = null, onSaved, groups = [] }) {
  const isEdit = !!guest?.id;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (guest) {
      const { code, number } = splitPhone(guest.phone);
      setForm({
        name: guest.name || '',
        phoneCode: code,
        phoneNumber: number,
        email: guest.email || '',
        party_size: guest.party_size ?? 1,
        group_name: guest.group_name || '',
        dietary_restrictions: guest.dietary_restrictions || '',
        notes: guest.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, guest]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && !invitationId) {
      setError('Selecciona primero una invitación en la parte superior de la página.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const phoneJoined = joinPhone(form.phoneCode, form.phoneNumber);
      const payload = {
        name: form.name.trim(),
        phone: phoneJoined || null,
        email: form.email.trim() || null,
        party_size: Number(form.party_size) || 1,
        group_name: form.group_name.trim() || null,
        dietary_restrictions: form.dietary_restrictions.trim() || null,
        notes: form.notes.trim() || null,
      };
      let saved;
      if (isEdit) {
        const { data } = await api.put(`/guests/${guest.id}`, payload);
        saved = data.data;
        toast({ title: 'Invitado actualizado' });
      } else {
        const { data } = await api.post('/guests', { ...payload, invitation_id: invitationId });
        saved = data.data;
        toast({ title: 'Invitado agregado' });
      }
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || 'Error al guardar';
      const existing = data?.details?.existing;
      if (existing) {
        setError(`${msg}: ya existe "${existing.name}" con el mismo email/teléfono`);
      } else if (Array.isArray(data?.errors) && data.errors.length) {
        const details = data.errors.map(e => `${e.field}: ${e.message}`).join('\n');
        setError(`${msg}\n${details}`);
      } else {
        setError(msg);
      }
      // eslint-disable-next-line no-console
      console.error('Guest save error', data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar invitado' : 'Agregar invitado'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Juan Pérez" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Teléfono</Label>
              <div className="flex gap-1">
                <select
                  className="h-10 rounded-md border border-input bg-background px-1.5 text-sm w-[108px] shrink-0"
                  value={form.phoneCode}
                  onChange={e => setForm({ ...form, phoneCode: e.target.value })}
                  title="Código de país"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={`${c.code}-${c.country}`} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.phoneNumber}
                  onChange={e => setForm({ ...form, phoneNumber: e.target.value.replace(/[^\d\s-]/g, '') })}
                  placeholder="1234 5678"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="juan@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pases (party size)</Label>
              <Input type="number" min="1" max="50" value={form.party_size}
                onChange={e => setForm({ ...form, party_size: e.target.value })} />
            </div>
            <div>
              <Label>Grupo / Familia</Label>
              <Input value={form.group_name} list="guest-groups"
                onChange={e => setForm({ ...form, group_name: e.target.value })}
                placeholder="Familia novia, Trabajo..." />
              <datalist id="guest-groups">
                {groups.map(g => <option key={g.group_name} value={g.group_name} />)}
              </datalist>
            </div>
          </div>
          <div>
            <Label>Restricciones alimenticias / alergias</Label>
            <Input value={form.dietary_restrictions}
              onChange={e => setForm({ ...form, dietary_restrictions: e.target.value })}
              placeholder="Vegetariano, sin gluten..." />
          </div>
          <div>
            <Label>Notas privadas</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas internas, no visibles para el invitado" />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-line">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Agregar')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
