import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { SanctionTable } from '@/features/sanctions/components/SanctionTable';
import {
  useConfirmSanction,
  useLiftSanction,
  useReduceSanction,
  useRejectSanction,
} from '@/features/sanctions/hooks/useSanctionMutations';
import { useSanctions } from '@/features/sanctions/hooks/useSanctions';
import {
  SANCTION_STATUSES,
  SANCTION_STATUS_LABELS,
  SANCTION_TYPES,
  SANCTION_TYPE_LABELS,
} from '@/features/sanctions/types/sanction';
import type { SanctionStatus, SanctionType } from '@/features/sanctions/types/sanction';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { FilterLayout } from '@/shared/components/FilterLayout';
import { LoadingState } from '@/shared/components/LoadingState';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';

const PAGE_SIZE = 10;

/** Bandeja de sanciones para el personal; el ADMIN confirma o rechaza las sugeridas por daño y reduce o levanta las activas (RF-08). */
export function SanctionsPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');
  const [status, setStatus] = useState<SanctionStatus | ''>('SUGGESTED');
  const [page, setPage] = useState(0);
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 300);
  const [type, setType] = useState<SanctionType | ''>('');
  const sanctions = useSanctions(
    status || undefined,
    page,
    PAGE_SIZE,
    debounced,
    type || undefined,
  );
  const confirm = useConfirmSanction();
  const reject = useRejectSanction();
  const lift = useLiftSanction();
  const reduce = useReduceSanction();
  const actionError = confirm.error ?? reject.error ?? lift.error ?? reduce.error;
  const isUpdating = confirm.isPending || reject.isPending || lift.isPending || reduce.isPending;

  return (
    <section>
      <PageHeader
        title="Sanciones"
        description="Atraso, reserva no recogida y pérdida (automáticas) y daño (sugerido, a confirmar por el administrador)."
      />
      <FilterLayout
        filters={
          <>
            <div>
              <label
                htmlFor="sanction-user"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Buscar usuario o ítem
              </label>
              <input
                id="sanction-user"
                type="search"
                placeholder="Nombre, correo, DNI o código de ítem"
                className={INPUT_CLASSES}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div>
              <label
                htmlFor="sanction-status"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Estado
              </label>
              <select
                id="sanction-status"
                className={`${INPUT_CLASSES} `}
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
            </div>
            <div>
              <label
                htmlFor="sanction-type"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Tipo
              </label>
              <select
                id="sanction-type"
                className={INPUT_CLASSES}
                value={type}
                onChange={(event) => {
                  setType(event.target.value as SanctionType | '');
                  setPage(0);
                }}
              >
                <option value="">Todos</option>
                {SANCTION_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {SANCTION_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
      >
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
              isUpdating={isUpdating}
              onConfirm={(id, days, damageLevel) => confirm.mutate({ id, days, damageLevel })}
              onReject={(id) => reject.mutate(id)}
              onLift={(id, reason) => lift.mutate({ id, reason })}
              onReduce={(id, days, reason) => reduce.mutate({ id, days, reason })}
            />
            <Pagination page={page} totalPages={sanctions.data.totalPages} onPageChange={setPage} />
          </Card>
        )}
      </FilterLayout>
    </section>
  );
}
