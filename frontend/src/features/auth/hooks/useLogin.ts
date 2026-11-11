import { useMutation } from '@tanstack/react-query';
import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/authStore';

/** Inicia sesión y, si el backend acepta las credenciales, guarda el token y el usuario en la sesión. */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: login,
    onSuccess: (response) => setSession(response.token, response.user),
  });
}
