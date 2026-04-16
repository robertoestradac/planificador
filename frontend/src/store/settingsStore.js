import { create } from 'zustand';
import api from '@/lib/api';

export const DEFAULT_SETTINGS = {
  app_name:      'InvitApp',
  tagline:       'Plataforma de invitaciones digitales',
  logo_url:      null,
  app_url:       null,
  support_email: null,
  footer_text:   'Hecha con ♥ por InvitApp',
  show_branding: 1,
};

const useSettingsStore = create((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded:   false,
  loading:  false,

  fetch: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const { data } = await api.get('/settings');
      if (data.success) set({ settings: data.data, loaded: true });
    } catch {
      /* keep defaults on error */
    } finally {
      set({ loading: false });
    }
  },

  update: async (fields) => {
    const { data } = await api.put('/settings', fields);
    if (data.success) set({ settings: data.data });
    return data;
  },

  invalidate: () => set({ loaded: false }),
}));

export default useSettingsStore;
