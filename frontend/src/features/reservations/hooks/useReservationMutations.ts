import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelReservation, createReservation } from '@/features/reservations/api/reservationsApi';

/** Crea una reserva y refresca las listas de reservas y la disponibilidad. */
export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

/** Cancela una reserva pendiente y refresca las listas de reservas y la disponibilidad. */
export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
