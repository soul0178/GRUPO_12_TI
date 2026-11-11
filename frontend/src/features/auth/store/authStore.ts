import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '@/features/auth/types/auth';

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  setSession: (token: string, user: SessionUser) => void;
  clearSession: () => void;
}

/** Sesión del usuario (token JWT y datos básicos). Se guarda en localStorage para sobrevivir a recargas. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    { name: 'epcc-session' },
  ),
);
