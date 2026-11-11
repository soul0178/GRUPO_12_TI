import { useAuthStore } from '@/features/auth/store/authStore';

/** Indica si el usuario autenticado es personal (MANAGER o ADMIN). Solo sirve para mostrar u ocultar opciones. */
export function useIsStaff(): boolean {
  return useAuthStore((state) => state.user?.role === 'MANAGER' || state.user?.role === 'ADMIN');
}
