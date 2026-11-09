import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('es_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('es_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;
          localStorage.setItem('es_access_token', newAccessToken);
          localStorage.setItem('es_refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('es_access_token');
          localStorage.removeItem('es_refresh_token');
          localStorage.removeItem('es_user');
          if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        }
      }
    }
    return Promise.reject(error);
  },
);
