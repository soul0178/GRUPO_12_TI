import type { Sanction } from '@/features/sanctions/types/sanction';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface SanctionNoticeProps {
  /** Sanciones ACTIVE del usuario; si no hay ninguna, no se muestra nada. */
  activeSanctions: Sanction[];
}

/** Aviso en el perfil cuando el usuario tiene una sanción activa (RF-08). */
export function SanctionNotice({ activeSanctions }: SanctionNoticeProps) {
  if (activeSanctions.length === 0) {
    return null;
  }
  const endDates = activeSanctions.flatMap((sanction) => (sanction.endAt ? [sanction.endAt] : []));
  const lastEnd = endDates.sort().at(-1);

  return (
    <div
      role="alert"
      className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200"
    >
      <p className="font-semibold">Tiene una sanción activa</p>
      <p className="mt-1">
        {`No puede hacer reservas ni recibir nuevos préstamos${lastEnd ? ` hasta el ${formatDateTime(lastEnd)}` : ''}.`}
      </p>
      <ul className="mt-2 list-inside list-disc text-amber-800">
        {activeSanctions.map((sanction) => (
          <li key={sanction.id}>{sanction.reason}</li>
        ))}
      </ul>
    </div>
  );
}
