import { useQuery } from '@tanstack/react-query';
import { getUser, getUsers, lookupUsers } from '@/features/users/api/usersApi';

/** Consulta una página de usuarios (pantalla de gestión, solo ADMIN). */
export function useUsers(page: number, size: number) {
  return useQuery({ queryKey: ['users', { page, size }], queryFn: () => getUsers(page, size) });
}

/** Consulta un usuario por id; se desactiva si no hay id (formulario de alta). */
export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id as number),
    enabled: id !== undefined,
  });
}

/** Busca usuarios por texto para el personal; no consulta mientras el texto esté vacío. */
export function useUserLookup(text: string) {
  return useQuery({
    queryKey: ['users', 'lookup', text],
    queryFn: () => lookupUsers(text),
    enabled: text.trim().length > 0,
  });
}
