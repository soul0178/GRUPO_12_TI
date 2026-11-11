import type {
  Availability,
  CreateReservationRequest,
  Reservation,
} from '@/features/reservations/types/reservation';
import { apiClient } from '@/shared/api/apiClient';
import type { Page } from '@/shared/types/api';

/** Llama a GET /items/{id}/availability?from=&to= (cualquier usuario autenticado). */
export async function getAvailability(
  itemId: number,
  from: string,
  to: string,
): Promise<Availability> {
  const { data } = await apiClient.get<Availability>(`/items/${itemId}/availability`, {
    params: { from, to },
  });
  return data;
}

/** Llama a POST /reservations: crea una reserva a nombre del usuario autenticado. */
export async function createReservation(request: CreateReservationRequest): Promise<Reservation> {
  const { data } = await apiClient.post<Reservation>('/reservations', request);
  return data;
}

/** Llama a POST /reservations/{id}/cancel: cancela una reserva pendiente propia. */
export async function cancelReservation(id: number): Promise<Reservation> {
  const { data } = await apiClient.post<Reservation>(`/reservations/${id}/cancel`);
  return data;
}

/** Llama a GET /me/reservations: reservas del usuario autenticado. */
export async function getMyReservations(page: number, size: number): Promise<Page<Reservation>> {
  const { data } = await apiClient.get<Page<Reservation>>('/me/reservations', {
    params: { page, size },
  });
  return data;
}
