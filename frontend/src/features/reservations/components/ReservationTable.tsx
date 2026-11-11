import { RESERVATION_STATUS_LABELS } from '@/features/reservations/types/reservation';
import type { Reservation, ReservationStatus } from '@/features/reservations/types/reservation';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface ReservationTableProps {
  reservations: Reservation[];
  isUpdating: boolean;
  onCancel: (id: number) => void;
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

const STATUS_TONES: Record<ReservationStatus, 'amber' | 'green' | 'slate' | 'red'> = {
  PENDING: 'amber',
  FULFILLED: 'green',
  CANCELLED: 'slate',
  EXPIRED: 'red',
};

/** Tabla de reservas del usuario; las pendientes se pueden cancelar desde la misma fila. */
export function ReservationTable({ reservations, isUpdating, onCancel }: ReservationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={HEADER_CLASSES}>Ítem</th>
            <th className={HEADER_CLASSES}>Desde</th>
            <th className={HEADER_CLASSES}>Hasta</th>
            <th className={HEADER_CLASSES}>Estado</th>
            <th className={`${HEADER_CLASSES} text-right`}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {reservations.map((reservation) => (
            <tr key={reservation.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{reservation.itemCode}</p>
                <p className="text-xs text-slate-500">{reservation.itemName}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {formatDateTime(reservation.startAt)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {formatDateTime(reservation.endAt)}
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONES[reservation.status]}>
                  {RESERVATION_STATUS_LABELS[reservation.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {reservation.status === 'PENDING' && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isUpdating}
                    aria-label={`Cancelar reserva de ${reservation.itemCode}`}
                    onClick={() => onCancel(reservation.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
