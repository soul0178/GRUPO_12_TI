import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, setUserActive, updateUser } from '@/features/users/api/usersApi';
import type { UpdateUserRequest } from '@/features/users/types/user';

/** Crea un usuario y refresca el listado. */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

/** Edita un usuario y refresca las consultas de usuarios. */
export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateUserRequest) => updateUser(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

/** Activa o desactiva un usuario y refresca el listado. */
export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => setUserActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
