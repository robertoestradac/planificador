import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import dataCache from '@/lib/dataCache';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      pending2fa: null,

      login: async (email, password, tenant_id = null) => {
        const payload = { email, password };
        if (tenant_id) payload.tenant_id = tenant_id;
        const { data } = await api.post('/auth/login', payload);
        const result = data.data;
        if (result.require2fa) {
          set({ pending2fa: result.temp_token });
          return { require2fa: true };
        }
        const { accessToken, refreshToken, user } = result;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        document.cookie = `access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`;
        document.cookie = `session_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
        set({ user, accessToken, refreshToken, isAuthenticated: true, pending2fa: null });
        return user;
      },

      verify2FA: async (code) => {
        const tempToken = get().pending2fa;
        if (!tempToken) throw new Error('No pending 2FA session');
        const { data } = await api.post('/auth/2fa/verify-login', { temp_token: tempToken, code });
        const { accessToken, refreshToken, user } = data.data;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        document.cookie = `access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`;
        document.cookie = `session_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
        set({ user, accessToken, refreshToken, isAuthenticated: true, pending2fa: null });
        return user;
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken });
        } catch {}
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'session_token=; path=/; max-age=0; SameSite=Lax';
        dataCache.clear();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const { data } = await api.get('/auth/me');
        set({ user: data.data });
        return data.data;
      },

      isSuperAdmin: () => get().user?.role === 'SuperAdmin',
      isAdmin: () => ['SuperAdmin', 'Admin'].includes(get().user?.role),
      isTenantUser: () => !!get().user?.tenant_id,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        pending2fa: state.pending2fa,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);

export default useAuthStore;
