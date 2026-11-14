import { useQuery } from '@tanstack/react-query';
import { getItemHistory, getUserHistory } from '@/features/reports/api/reportsApi';
import type { HistoryFilters } from '@/features/reports/types/report';

/** Historial de préstamos de un usuario; no consulta mientras no haya usuario elegido. */
export function useUserHistory(
  userId: number | undefined,
  filters: HistoryFilters,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: ['reports', 'users', userId, filters, page, size],
    queryFn: () => getUserHistory(userId as number, filters, page, size),
    enabled: userId !== undefined,
  });
}

/** Historial de préstamos de un ítem; no consulta mientras no haya ítem elegido. */
export function useItemHistory(
  itemId: number | undefined,
  filters: HistoryFilters,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: ['reports', 'items', itemId, filters, page, size],
    queryFn: () => getItemHistory(itemId as number, filters, page, size),
    enabled: itemId !== undefined,
  });
}
