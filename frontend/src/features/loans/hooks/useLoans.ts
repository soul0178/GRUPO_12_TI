import { useQuery } from '@tanstack/react-query';
import { getLoan, getLoans } from '@/features/loans/api/loansApi';
import type { LoanFilters } from '@/features/loans/types/loan';

/** Consulta una página de préstamos con los filtros indicados. */
export function useLoans(filters: LoanFilters, page: number, size: number) {
  return useQuery({
    queryKey: ['loans', filters, page, size],
    queryFn: () => getLoans(filters, page, size),
  });
}

/** Consulta un préstamo por id. */
export function useLoan(id: number) {
  return useQuery({ queryKey: ['loans', id], queryFn: () => getLoan(id) });
}
