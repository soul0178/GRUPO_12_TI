import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getMySanctions, getSanctions } from '@/features/sanctions/api/sanctionsApi';
import type { SanctionStatus } from '@/features/sanctions/types/sanction';

/** Consulta una página de sanciones de todos los usuarios (personal), con filtro opcional de estado y de usuario. */
export function useSanctions(
  status: SanctionStatus | undefined,
  page: number,
  size: number,
  text = '',
) {
  return useQuery({
    queryKey: ['sanctions', { status, page, size, text }],
    queryFn: () => getSanctions(status, page, size, text),
    placeholderData: keepPreviousData,
  });
}

/** Consulta las sanciones del usuario autenticado, con filtro opcional de estado. */
export function useMySanctions(status?: SanctionStatus) {
  return useQuery({ queryKey: ['my-sanctions', status], queryFn: () => getMySanctions(status) });
}
