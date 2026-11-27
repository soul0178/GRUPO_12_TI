import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getUser, getUsers, lookupUsers } from '@/features/users/api/usersApi';

/** Consulta una página de usuarios (pantalla de gestión, solo ADMIN), con filtro opcional por texto. */
export function useUsers(page: number, size: number, text = '') {
  return useQuery({
    queryKey: ['users', { page, size, text }],
    queryFn: () => getUsers(page, size, text),
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
