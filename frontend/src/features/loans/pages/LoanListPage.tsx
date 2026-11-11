import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoanTable } from '@/features/loans/components/LoanTable';
import { useLoans } from '@/features/loans/hooks/useLoans';
import { LOAN_STATUSES, LOAN_STATUS_LABELS } from '@/features/loans/types/loan';
import type { LoanStatus } from '@/features/loans/types/loan';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { PRIMARY_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

const PAGE_SIZE = 10;

/** Listado de préstamos para el personal, con filtro por estado y acceso a entregas y devoluciones (RF-04). */
export function LoanListPage() {
  const [status, setStatus] = useState<LoanStatus | ''>('');
  const [page, setPage] = useState(0);
  const loans = useLoans({ status: status || undefined }, page, PAGE_SIZE);

  return (
    <section>
      <PageHeader
        title="Préstamos"
        description="Entregas y devoluciones de ítems."
        actions={
          <Link to="/loans/new" className={PRIMARY_LINK_CLASSES}>
            Registrar entrega
          </Link>
        }
      />
      <div className="space-y-4">
        <Card className="p-4">
          <label htmlFor="loan-status" className="mb-1.5 block text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            id="loan-status"
            className={`${INPUT_CLASSES} sm:max-w-xs`}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as LoanStatus | '');
              setPage(0);
            }}
          >
            <option value="">Todos</option>
            {LOAN_STATUSES.map((value) => (
              <option key={value} value={value}>
                {LOAN_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Card>

        {loans.isError && <Alert variant="error">{getErrorMessage(loans.error)}</Alert>}
        {loans.isLoading && <LoadingState message="Cargando préstamos..." />}
        {loans.data && loans.data.content.length === 0 && (
          <EmptyState message="No hay préstamos para mostrar." />
        )}
        {loans.data && loans.data.content.length > 0 && (
          <Card className="overflow-hidden">
            <LoanTable loans={loans.data.content} />
            <Pagination page={page} totalPages={loans.data.totalPages} onPageChange={setPage} />
          </Card>
        )}
      </div>
    </section>
  );
}
