import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  confirmSanction,
  liftSanction,
  reduceSanction,
  rejectSanction,
} from '@/features/sanctions/api/sanctionsApi';
import type { DamageLevel } from '@/features/sanctions/types/sanction';

/** Confirma una sanción sugerida (días y nivel opcionales) y refresca las listas de sanciones. */
export function useConfirmSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      days,
      damageLevel,
    }: {
      id: number;
      days?: number;
      damageLevel?: DamageLevel;
    }) => confirmSanction(id, { days, damageLevel }),
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

/** Levanta una sanción activa con un motivo y refresca las listas de sanciones. */
export function useLiftSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => liftSanction(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sanctions'] }),
  });
}

/** Reduce una sanción activa a una duración total menor y refresca las listas de sanciones. */
export function useReduceSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days, reason }: { id: number; days: number; reason: string }) =>
      reduceSanction(id, days, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sanctions'] }),
  });
}
