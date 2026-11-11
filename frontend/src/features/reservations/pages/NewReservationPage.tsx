import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Item } from '@/features/inventory/types/inventory';
import { AvailabilityPanel } from '@/features/reservations/components/AvailabilityPanel';
import { ReservableItemPicker } from '@/features/reservations/components/ReservableItemPicker';
import { useCreateReservation } from '@/features/reservations/hooks/useReservationMutations';
import { useAvailability } from '@/features/reservations/hooks/useReservations';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { PageHeader } from '@/shared/components/PageHeader';
import { formatDateTime, limaLocalToIso } from '@/shared/utils/dateFormat';

const MILLIS_PER_HOUR = 3_600_000;

/** Devuelve el motivo por el que el rango no es válido, o null si lo es. */
function validateRange(start: string, end: string, item: Item): string | null {
  if (!start || !end) {
    return null;
  }
  const startMs = new Date(limaLocalToIso(start)).getTime();
  const endMs = new Date(limaLocalToIso(end)).getTime();
  if (startMs <= Date.now()) {
    return 'La reserva debe empezar en el futuro.';
  }
  if (endMs <= startMs) {
    return 'La fecha de fin debe ser posterior a la de inicio.';
  }
  if (endMs - startMs > item.category.maxLoanHours * MILLIS_PER_HOUR) {
    return `La reserva no puede durar más de ${item.category.maxLoanHours} horas.`;
  }
  return null;
}

/** Reserva en tres pasos: elegir el ítem, elegir el rango (con su disponibilidad) y confirmar (RF-05, RNF-03). */
export function NewReservationPage() {
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [confirming, setConfirming] = useState(false);
  const createReservation = useCreateReservation();

  const rangeError = item ? validateRange(start, end, item) : null;
  const validRange = Boolean(item && start && end && !rangeError);
  const availability = useAvailability(
    item?.id,
    validRange ? limaLocalToIso(start) : null,
    validRange ? limaLocalToIso(end) : null,
  );

  function handleConfirm() {
    if (!item) {
      return;
    }
    createReservation.mutate(
      { itemId: item.id, startAt: limaLocalToIso(start), endAt: limaLocalToIso(end) },
      { onSuccess: () => navigate('/reservations') },
    );
  }

  function backToRange() {
    setConfirming(false);
    createReservation.reset();
  }

  return (
    <section>
      <PageHeader
        title="Nueva reserva"
        description="Paso 1: ítem · Paso 2: horario · Paso 3: confirmar."
      />
      <Card className="max-w-3xl space-y-6 p-6">
        {!item && <ReservableItemPicker onSelect={setItem} />}

        {item && !confirming && (
          <>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
              <p className="text-sm font-medium text-slate-900">{`${item.code} · ${item.name}`}</p>
              <Button variant="secondary" size="sm" onClick={() => setItem(null)}>
                Cambiar ítem
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reservation-start"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Inicio
                </label>
                <input
                  id="reservation-start"
                  type="datetime-local"
                  className={INPUT_CLASSES}
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="reservation-end"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Fin
                </label>
                <input
                  id="reservation-end"
                  type="datetime-local"
                  className={INPUT_CLASSES}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {`Hora de Lima. Duración máxima: ${item.category.maxLoanHours} horas.`}
            </p>
            {rangeError && <Alert variant="error">{rangeError}</Alert>}
            {availability.isError && (
              <Alert variant="error">{getErrorMessage(availability.error)}</Alert>
            )}
            {availability.data && <AvailabilityPanel availability={availability.data} />}
            <Button disabled={!availability.data?.available} onClick={() => setConfirming(true)}>
              Continuar
            </Button>
          </>
        )}

        {item && confirming && (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Ítem</dt>
                <dd className="font-medium text-slate-900">{`${item.code} · ${item.name}`}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Horario</dt>
                <dd className="font-medium text-slate-900">
                  {`${formatDateTime(limaLocalToIso(start))} – ${formatDateTime(limaLocalToIso(end))}`}
                </dd>
              </div>
            </dl>
            {createReservation.isError && (
              <Alert variant="error">{getErrorMessage(createReservation.error)}</Alert>
            )}
            <div className="flex gap-3">
              <Button disabled={createReservation.isPending} onClick={handleConfirm}>
                {createReservation.isPending ? 'Reservando...' : 'Confirmar reserva'}
              </Button>
              <Button variant="secondary" onClick={backToRange}>
                Volver
              </Button>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
