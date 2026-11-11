import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { changePassword, getProfile, updateProfile } from '@/features/users/api/usersApi';

/** Consulta el perfil del usuario autenticado. */
export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: getProfile });
}

/** Edita el contacto del perfil y actualiza el nombre que muestra la sesión. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(['profile'], user);
      const { token, setSession } = useAuthStore.getState();
      if (token) {
        setSession(token, {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        });
      }
    },
  });
}

/** Cambia la contraseña del usuario autenticado. */
export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
