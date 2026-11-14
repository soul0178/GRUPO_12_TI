import { Link } from 'react-router-dom';
import { RESERVATION_STATUS_LABELS } from '@/features/reservations/types/reservation';
import type { Reservation, ReservationStatus } from '@/features/reservations/types/reservation';
import { Badge } from '@/shared/components/Badge';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface StaffReservationTableProps {
  reservations: Reservation[];
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

const STATUS_TONES: Record<ReservationStatus, 'amber' | 'green' | 'slate' | 'red'> = {
  PENDING: 'amber',
  FULFILLED: 'green',
  CANCELLED: 'slate',
  EXPIRED: 'red',
};

/** Tabla de reservas de todos los usuarios; las pendientes llevan el enlace para registrar la entrega. */
export function StaffReservationTable({ reservations }: StaffReservationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={HEADER_CLASSES}>Usuario</th>
            <th className={HEADER_CLASSES}>Ítem</th>
            <th className={HEADER_CLASSES}>Desde</th>
            <th className={HEADER_CLASSES}>Hasta</th>
            <th className={HEADER_CLASSES}>Estado</th>
            <th className={`${HEADER_CLASSES} text-right`}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {reservations.map((reservation) => (
            <tr key={reservation.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{reservation.userFullName}</p>
                <p className="text-xs text-slate-500">{reservation.userEmail}</p>
              </td>
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
                  <Link
                    to="/loans/new"
                    state={{ reservation }}
                    aria-label={`Entregar ${reservation.itemCode} a ${reservation.userFullName}`}
                    className={TEXT_LINK_CLASSES}
                  >
                    Entregar
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
