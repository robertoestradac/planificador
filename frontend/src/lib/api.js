import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Importante para Laravel Sanctum (cookies CSRF)
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 (excluye rutas de auth para evitar bucles)
const AUTH_ROUTES = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/2fa/verify-login'];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = AUTH_ROUTES.some((r) => original.url?.includes(r));
    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        // Soportar tanto camelCase como snake_case
        const accessToken = data.data.accessToken || data.data.access_token;
        const newRefreshToken = data.data.refreshToken || data.data.refresh_token;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        const onAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        window.location.href = onAdmin ? '/adminsis' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
