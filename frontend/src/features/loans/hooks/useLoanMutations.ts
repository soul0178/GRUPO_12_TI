import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLoan, returnLoan } from '@/features/loans/api/loansApi';
import type { ReturnLoanRequest } from '@/features/loans/types/loan';

/** Registra una entrega y refresca préstamos y catálogo (el ítem pasa a "Prestado"). */
export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLoan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loans'] });
      void queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

/** Registra una devolución y refresca préstamos, catálogo y sanciones (puede generar sanciones). */
export function useReturnLoan(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ReturnLoanRequest) => returnLoan(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loans'] });
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['sanctions'] });
    },
  });
}
