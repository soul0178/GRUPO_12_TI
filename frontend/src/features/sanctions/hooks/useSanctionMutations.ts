import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmSanction, rejectSanction } from '@/features/sanctions/api/sanctionsApi';

/** Confirma una sanción sugerida con los días indicados y refresca las listas de sanciones. */
export function useConfirmSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) => confirmSanction(id, days),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sanctions'] }),
  });
}

/** Rechaza una sanción sugerida y refresca las listas de sanciones. */
export function useRejectSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectSanction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sanctions'] }),
  });
}
