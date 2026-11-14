import { useState } from 'react';
import { ReservationTabs } from '@/features/reservations/components/ReservationTabs';
import { StaffReservationTable } from '@/features/reservations/components/StaffReservationTable';
import { useAllReservations } from '@/features/reservations/hooks/useReservations';
import { RESERVATION_STATUS_LABELS } from '@/features/reservations/types/reservation';
import type { ReservationStatus } from '@/features/reservations/types/reservation';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';

const PAGE_SIZE = 10;
const STATUSES = Object.keys(RESERVATION_STATUS_LABELS) as ReservationStatus[];

/**
 * Reservas de todos los usuarios para el personal. Por defecto muestra las pendientes, las más próximas primero,
 * y cada una lleva el botón "Entregar" que abre el registro de entrega con el usuario y el ítem ya elegidos.
 */
export function StaffReservationsPage() {
  const [status, setStatus] = useState<ReservationStatus | ''>('PENDING');
  const [page, setPage] = useState(0);
  const sort = status === 'PENDING' ? 'startAt,asc' : 'startAt,desc';
  const reservations = useAllReservations({ status: status || undefined }, page, PAGE_SIZE, sort);

  return (
    <section>
      <PageHeader
        title="Reservas"
        description="Reservas de todos los usuarios. Entregue el ítem desde la reserva pendiente."
      />
      <ReservationTabs />
      <div className="space-y-4">
        <Card className="p-4">
          <label
            htmlFor="reservation-status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Estado
          </label>
          <select
            id="reservation-status"
            className={`${INPUT_CLASSES} sm:max-w-xs`}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ReservationStatus | '');
              setPage(0);
            }}
          >
            <option value="">Todos</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {RESERVATION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Card>

        {reservations.isError && (
          <Alert variant="error">{getErrorMessage(reservations.error)}</Alert>
        )}
        {reservations.isLoading && <LoadingState message="Cargando reservas..." />}
        {reservations.data && reservations.data.content.length === 0 && (
          <EmptyState message="No hay reservas para mostrar." />
        )}
        {reservations.data && reservations.data.content.length > 0 && (
          <Card className="overflow-hidden">
            <StaffReservationTable reservations={reservations.data.content} />
            <Pagination
              page={page}
              totalPages={reservations.data.totalPages}
              onPageChange={setPage}
            />
          </Card>
        )}
      </div>
    </section>
  );
}
