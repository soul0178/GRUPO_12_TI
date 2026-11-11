import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ReservationTable } from '@/features/reservations/components/ReservationTable';
import { useCancelReservation } from '@/features/reservations/hooks/useReservationMutations';
import { useMyReservations } from '@/features/reservations/hooks/useReservations';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { PRIMARY_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

const PAGE_SIZE = 10;

/** Lista las reservas del usuario y permite cancelar las pendientes (RF-05). */
export function MyReservationsPage() {
  const [page, setPage] = useState(0);
  const reservations = useMyReservations(page, PAGE_SIZE);
  const cancel = useCancelReservation();

  return (
    <section>
      <PageHeader
        title="Mis reservas"
        description="Recoja el ítem dentro del plazo desde el inicio de la reserva, o expirará."
        actions={
          <Link to="/reservations/new" className={PRIMARY_LINK_CLASSES}>
            Nueva reserva
          </Link>
        }
      />
      <div className="space-y-4">
        {cancel.isError && <Alert variant="error">{getErrorMessage(cancel.error)}</Alert>}
        {reservations.isError && (
          <Alert variant="error">{getErrorMessage(reservations.error)}</Alert>
        )}
        {reservations.isLoading && <LoadingState message="Cargando reservas..." />}
        {reservations.data && reservations.data.content.length === 0 && (
          <EmptyState message="Aún no tiene reservas." />
        )}
        {reservations.data && reservations.data.content.length > 0 && (
          <Card className="overflow-hidden">
            <ReservationTable
              reservations={reservations.data.content}
              isUpdating={cancel.isPending}
              onCancel={(id) => cancel.mutate(id)}
            />
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
