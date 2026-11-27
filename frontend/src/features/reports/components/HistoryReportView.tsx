import type { UseQueryResult } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LOAN_STATUSES, LOAN_STATUS_LABELS } from '@/features/loans/types/loan';
import type { LoanStatus } from '@/features/loans/types/loan';
import { HistorySummary } from '@/features/reports/components/HistorySummary';
import { HistoryTable } from '@/features/reports/components/HistoryTable';
import type { HistoryFilters, LoanHistoryReport } from '@/features/reports/types/report';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { LoadingState } from '@/shared/components/LoadingState';
import { Pagination } from '@/shared/components/Pagination';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface HistoryReportViewProps {
  query: UseQueryResult<LoanHistoryReport>;
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
  page: number;
  onPageChange: (page: number) => void;
  firstColumn: 'item' | 'user';
  /** Enlace para volver a elegir otro usuario o ítem. */
  changeLink: { to: string; label: string };
}

/** Cuerpo común de los dos historiales: sujeto, resumen, filtros por fecha y estado, y la tabla paginada. */
export function HistoryReportView({
  query,
  filters,
  onFiltersChange,
  page,
  onPageChange,
  firstColumn,
  changeLink,
}: HistoryReportViewProps) {
  const report = query.data;

  function update(changes: Partial<HistoryFilters>) {
    onFiltersChange({ ...filters, ...changes });
    onPageChange(0);
  }

  return (
    <div className="space-y-4">
      {query.isError && <Alert variant="error">{getErrorMessage(query.error)}</Alert>}
      {query.isLoading && <LoadingState message="Cargando historial..." />}
      {report && (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{report.subject.name}</h2>
              <p className="text-sm text-slate-500">{report.subject.detail}</p>
            </div>
            <Link
              to={changeLink.to}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {changeLink.label}
            </Link>
          </Card>

          <HistorySummary summary={report.summary} />

          <Card className="grid gap-4 p-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="history-from"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Desde
              </label>
              <input
                id="history-from"
                type="date"
                className={INPUT_CLASSES}
                value={filters.from ?? ''}
                max={filters.to || undefined}
                onChange={(event) => update({ from: event.target.value || undefined })}
              />
            </div>
            <div>
              <label
                htmlFor="history-to"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Hasta
              </label>
              <input
                id="history-to"
                type="date"
                className={INPUT_CLASSES}
                value={filters.to ?? ''}
                min={filters.from || undefined}
                onChange={(event) => update({ to: event.target.value || undefined })}
              />
            </div>
            <div>
              <label
                htmlFor="history-status"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Estado
              </label>
              <select
                id="history-status"
                className={INPUT_CLASSES}
                value={filters.status ?? ''}
                onChange={(event) =>
                  update({ status: (event.target.value as LoanStatus | '') || undefined })
                }
              >
                <option value="">Todos</option>
                {LOAN_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {LOAN_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {report.loans.content.length === 0 ? (
            <EmptyState message="No hay préstamos para esos filtros." />
          ) : (
            <Card className="overflow-hidden">
              <HistoryTable loans={report.loans.content} firstColumn={firstColumn} />
              <Pagination
                page={page}
                totalPages={report.loans.totalPages}
                onPageChange={onPageChange}
              />
            </Card>
          )}
          <p className="text-xs text-slate-400">Generado el {formatDateTime(report.generatedAt)}</p>
        </>
      )}
    </div>
  );
}
