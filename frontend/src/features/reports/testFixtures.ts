import { loanFixture, pageOf } from '@/features/loans/testFixtures';
import type { Loan } from '@/features/loans/types/loan';
import type { LoanHistoryReport } from '@/features/reports/types/report';

/** Reporte de ejemplo; se pueden sobreescribir campos. */
export function reportFixture(
  loans: Loan[] = [loanFixture()],
  overrides: Partial<LoanHistoryReport> = {},
): LoanHistoryReport {
  return {
    subject: { id: 20, name: 'Luis Quispe', detail: 'luis@epcc.unsa.edu.pe · 72345678' },
    from: null,
    to: null,
    generatedAt: '2026-03-12T15:00:00Z',
    summary: {
      total: 7,
      active: 1,
      overdue: 2,
      returned: 4,
      returnedLate: 3,
      returnedDamaged: 1,
    },
    loans: pageOf(loans),
    ...overrides,
  };
}
