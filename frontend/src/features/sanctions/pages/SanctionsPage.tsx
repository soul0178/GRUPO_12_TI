import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { SanctionTable } from '@/features/sanctions/components/SanctionTable';
import {
  useConfirmSanction,
  useRejectSanction,
} from '@/features/sanctions/hooks/useSanctionMutations';
import { useSanctions } from '@/features/sanctions/hooks/useSanctions';
import { SANCTION_STATUSES, SANCTION_STATUS_LABELS } from '@/features/sanctions/types/sanction';
import type { SanctionStatus } from '@/features/sanctions/types/sanction';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';

const PAGE_SIZE = 10;

/** Bandeja de sanciones para el personal; el ADMIN confirma o rechaza las sugeridas por daño (RF-08). */
export function SanctionsPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');
  const [status, setStatus] = useState<SanctionStatus | ''>('SUGGESTED');
  const [page, setPage] = useState(0);
  const sanctions = useSanctions(status || undefined, page, PAGE_SIZE);
  const confirm = useConfirmSanction();
  const reject = useRejectSanction();
  const actionError = confirm.error ?? reject.error;

  return (
    <section>
      <PageHeader
        title="Sanciones"
        description="Sanciones por atraso (automáticas) y por posible daño (sugeridas, a confirmar por el administrador)."
      />
      <div className="space-y-4">
        <Card className="p-4">
          <label
            htmlFor="sanction-status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Estado
          </label>
          <select
            id="sanction-status"
            className={`${INPUT_CLASSES} sm:max-w-xs`}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SanctionStatus | '');
              setPage(0);
            }}
          >
            <option value="">Todas</option>
            {SANCTION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {SANCTION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Card>

        {actionError && <Alert variant="error">{getErrorMessage(actionError)}</Alert>}
        {sanctions.isError && <Alert variant="error">{getErrorMessage(sanctions.error)}</Alert>}
        {sanctions.isLoading && <LoadingState message="Cargando sanciones..." />}
        {sanctions.data && sanctions.data.content.length === 0 && (
          <EmptyState message="No hay sanciones para mostrar." />
        )}
        {sanctions.data && sanctions.data.content.length > 0 && (
          <Card className="overflow-hidden">
            <SanctionTable
              sanctions={sanctions.data.content}
              canResolve={isAdmin}
              isUpdating={confirm.isPending || reject.isPending}
              onConfirm={(id, days) => confirm.mutate({ id, days })}
              onReject={(id) => reject.mutate(id)}
            />
            <Pagination page={page} totalPages={sanctions.data.totalPages} onPageChange={setPage} />
          </Card>
        )}
      </div>
    </section>
  );
}
