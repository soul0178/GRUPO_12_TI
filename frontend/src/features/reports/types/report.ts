import type { Loan, LoanStatus } from '@/features/loans/types/loan';
import type { Page } from '@/shared/types/api';

/** Usuario o ítem al que pertenece el reporte (ReportSubject). */
export interface ReportSubject {
  id: number;
  name: string;
  detail: string;
}

/** Totales del historial: total = activos + vencidos + devueltos; devueltos = normales + dañados + perdidos. */
export interface LoanHistorySummary {
  total: number;
  active: number;
  overdue: number;
  returned: number;
  returnedLate: number;
  returnedNormal: number;
  returnedDamaged: number;
  returnedLost: number;
}

/** Historial de préstamos de un usuario o de un ítem (LoanHistoryReport). */
export interface LoanHistoryReport {
  subject: ReportSubject;
  from: string | null;
  to: string | null;
  generatedAt: string;
  summary: LoanHistorySummary;
  loans: Page<Loan>;
}

/** Filtros opcionales del historial; las fechas van como yyyy-MM-dd (hora de Lima). */
export interface HistoryFilters {
  from?: string;
  to?: string;
  status?: LoanStatus;
}
