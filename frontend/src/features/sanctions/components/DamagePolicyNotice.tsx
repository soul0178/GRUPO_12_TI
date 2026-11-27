import { DAMAGE_LEVEL_INFO, SANCTION_DAYS } from '@/features/sanctions/types/sanctionPolicy';
import { DAMAGE_LEVELS, DAMAGE_LEVEL_LABELS } from '@/features/sanctions/types/sanction';

/** Aviso breve que se muestra al reservar: qué es un ítem dañado, sus niveles y las sanciones. */
export function DamagePolicyNotice() {
  return (
    <section
      aria-label="Política de daños y sanciones"
      className=" bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200"
    >
      <h2 className="font-semibold">Antes de reservar: ¿qué se considera un ítem dañado?</h2>
      <p className="mt-1">
        Si devuelve un ítem en peor estado del que lo recibió, se registra un daño y se le suspende
        para reservar y recibir préstamos:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-0.5">
        {DAMAGE_LEVELS.map((level) => (
          <li key={level}>
            <strong>{`${DAMAGE_LEVEL_LABELS[level]} (${DAMAGE_LEVEL_INFO[level].days} días)`}</strong>
            {`: ${DAMAGE_LEVEL_INFO[level].description}. Ej.: ${DAMAGE_LEVEL_INFO[level].examples}.`}
          </li>
        ))}
        <li>
          <strong>{`Pérdida (${SANCTION_DAYS.loss} días, falta grave)`}</strong>: el ítem no se
          devuelve.
        </li>
      </ul>
      <p className="mt-2">
        {`No recoger su reserva a tiempo: ${SANCTION_DAYS.noShow} día. Devolver tarde: 1 día por día de atraso. `}
        Si reincide en 6 meses, la suspensión se duplica o triplica. Con más de{' '}
        {SANCTION_DAYS.maxGraveFaults} faltas graves (pérdida o daño extremo) queda baneado.
      </p>
    </section>
  );
}
