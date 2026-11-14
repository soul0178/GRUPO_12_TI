import type { HistoryFilters, LoanHistoryReport } from '@/features/reports/types/report';
import { apiClient } from '@/shared/api/apiClient';

/** Llama a GET /reports/users/{id}/loans (personal): historial de préstamos de un usuario. */
export async function getUserHistory(
  userId: number,
  filters: HistoryFilters,
  page: number,
  size: number,
): Promise<LoanHistoryReport> {
  const { data } = await apiClient.get<LoanHistoryReport>(`/reports/users/${userId}/loans`, {
    params: { ...filters, page, size },
  });
  return data;
}

/** Llama a GET /reports/items/{id}/loans (personal): historial de préstamos de un ítem. */
export async function getItemHistory(
  itemId: number,
  filters: HistoryFilters,
  page: number,
  size: number,
): Promise<LoanHistoryReport> {
  const { data } = await apiClient.get<LoanHistoryReport>(`/reports/items/${itemId}/loans`, {
    params: { ...filters, page, size },
  });
  return data;
}
