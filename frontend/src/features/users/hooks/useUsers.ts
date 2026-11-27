import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Role } from '@/features/auth/types/auth';
import { getUser, getUsers, lookupUsers } from '@/features/users/api/usersApi';

/** Consulta una página de usuarios (pantalla de gestión, solo ADMIN), con filtros opcionales por texto y rol. */
export function useUsers(page: number, size: number, text = '', role?: Role) {
  return useQuery({
    queryKey: ['users', { page, size, text, role }],
    queryFn: () => getUsers(page, size, text, role),
    placeholderData: keepPreviousData,
  });
}

/** Consulta un usuario por id; se desactiva si no hay id (formulario de alta). */
export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id as number),
    enabled: id !== undefined,
  });
}

/**
 * Busca usuarios por texto para el personal. Con el texto vacío no consulta, salvo que se pida el listado
 * completo (`listAll`, usado en los reportes): entonces el backend devuelve todos los usuarios.
 */
export function useUserLookup(text: string, listAll = false) {
  return useQuery({
    queryKey: ['users', 'lookup', text, listAll],
    queryFn: () => lookupUsers(text),
    enabled: listAll || text.trim().length > 0,
  });
}
