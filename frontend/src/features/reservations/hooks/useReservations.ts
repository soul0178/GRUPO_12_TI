import { useQuery } from '@tanstack/react-query';
import {
  getAvailability,
  getMyReservations,
  getReservations,
} from '@/features/reservations/api/reservationsApi';
import type { ReservationFilters } from '@/features/reservations/types/reservation';

/** Consulta una página de las reservas del usuario autenticado. */
export function useMyReservations(page: number, size: number) {
  return useQuery({
    queryKey: ['reservations', 'mine', page, size],
    queryFn: () => getMyReservations(page, size),
  });
}

/** Consulta una página de todas las reservas (personal); `sort` en formato Spring, p. ej. "startAt,asc". */
export function useAllReservations(
  filters: ReservationFilters,
  page: number,
  size: number,
  sort: string,
) {
  return useQuery({
    queryKey: ['reservations', 'all', filters, page, size, sort],
    queryFn: () => getReservations(filters, page, size, sort),
  });
}

/** Consulta la disponibilidad de un ítem en un rango; no consulta hasta tener ítem y rango válidos. */
export function useAvailability(
  itemId: number | undefined,
  from: string | null,
  to: string | null,
) {
  return useQuery({
    queryKey: ['availability', itemId, from, to],
    queryFn: () => getAvailability(itemId as number, from as string, to as string),
    enabled: itemId !== undefined && from !== null && to !== null,
  });
}
