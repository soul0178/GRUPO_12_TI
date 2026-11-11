import axios from 'axios';
import { useAuthStore } from '@/features/auth/store/authStore';

const HTTP_UNAUTHORIZED = 401;

/** Única instancia de Axios de la aplicación: agrega el token JWT y cierra la sesión si el backend responde 401. */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === HTTP_UNAUTHORIZED) {
      // Al limpiar la sesión, ProtectedRoute redirige al login.
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);
