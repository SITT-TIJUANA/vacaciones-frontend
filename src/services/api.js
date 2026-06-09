import axios from 'axios';

const API_URL = 'https://vacaciones-backend-7ota.onrender.com';

const api = axios.create({ baseURL: API_URL });

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Solo redirigir al login si el token expiró (no en login)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginEndpoint = err.config?.url?.includes('/api/auth/login');
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/vacaciones-frontend/';
    }
    return Promise.reject(err);
  }
);

export default api;
