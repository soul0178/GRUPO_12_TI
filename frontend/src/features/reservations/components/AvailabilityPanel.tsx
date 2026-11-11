import { BUSY_TYPE_LABELS } from '@/features/reservations/types/reservation';
import type { Availability } from '@/features/reservations/types/reservation';
import { Alert } from '@/shared/components/Alert';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface AvailabilityPanelProps {
  availability: Availability;
}

/** Calendario simple: indica si el ítem está libre en el rango elegido y lista los tramos ocupados. */
export function AvailabilityPanel({ availability }: AvailabilityPanelProps) {
  return (
    <div className="space-y-2">
      {availability.available ? (
        <Alert variant="success">El ítem está libre en ese horario.</Alert>
      ) : (
        <Alert variant="error">El ítem no está disponible en ese horario.</Alert>
      )}
      {availability.busyRanges.length > 0 && (
        <ul className="space-y-1 text-sm text-slate-600">
          {availability.busyRanges.map((range) => (
            <li key={`${range.type}-${range.startAt}`}>
              {`${BUSY_TYPE_LABELS[range.type]}: ${formatDateTime(range.startAt)} – ${formatDateTime(range.endAt)}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
