import type {
  CreateLoanRequest,
  Loan,
  LoanFilters,
  ReturnLoanRequest,
} from '@/features/loans/types/loan';
import { apiClient } from '@/shared/api/apiClient';
import type { Page } from '@/shared/types/api';

/** Llama a GET /loans (personal), con filtro opcional de estado. */
export async function getLoans(
  filters: LoanFilters,
  page: number,
  size: number,
): Promise<Page<Loan>> {
  const { data } = await apiClient.get<Page<Loan>>('/loans', {
    params: { page, size, status: filters.status },
  });
  return data;
}

/** Llama a GET /loans/{id} (personal). */
export async function getLoan(id: number): Promise<Loan> {
  const { data } = await apiClient.get<Loan>(`/loans/${id}`);
  return data;
}

/** Llama a POST /loans: registra la entrega de un ítem. */
export async function createLoan(request: CreateLoanRequest): Promise<Loan> {
  const { data } = await apiClient.post<Loan>('/loans', request);
  return data;
}

/** Llama a POST /loans/{id}/return: registra la devolución. */
export async function returnLoan(id: number, request: ReturnLoanRequest): Promise<Loan> {
  const { data } = await apiClient.post<Loan>(`/loans/${id}/return`, request);
  return data;
}
