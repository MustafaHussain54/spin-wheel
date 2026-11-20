import axios from 'axios';

// Explicitly use the live Render backend URL, with fallback to env or relative path
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://spin-wheel-cvd9.onrender.com/api';

const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expo_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic redirect on expired session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('expo_admin_token');
        localStorage.removeItem('expo_admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
