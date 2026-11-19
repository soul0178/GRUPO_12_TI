import { useState } from 'react';
import { DAMAGE_LEVELS, DAMAGE_LEVEL_LABELS } from '@/features/sanctions/types/sanction';
import type { DamageLevel } from '@/features/sanctions/types/sanction';
import { Button } from '@/shared/components/Button';
import { INPUT_CLASSES } from '@/shared/components/FormField';

const MIN_DAYS = 1;
const MAX_DAYS = 365;

interface SuggestedActionsProps {
  /** Nombre del usuario sancionado, para el texto accesible de los campos. */
  userName: string;
  /** Nivel de daño registrado al recibir el ítem. */
  initialLevel: DamageLevel;
  disabled: boolean;
  /** Sin días se aplica la duración de la política para el nivel (con reincidencia). */
  onConfirm: (days: number | undefined, level: DamageLevel) => void;
  onReject: () => void;
}

/** Controles de una sanción de daño sugerida: nivel, días (opcional) y botones Confirmar / Rechazar (ADMIN). */
export function SuggestedActions({
  userName,
  initialLevel,
  disabled,
  onConfirm,
  onReject,
}: SuggestedActionsProps) {
  const [level, setLevel] = useState<DamageLevel>(initialLevel);
  const [days, setDays] = useState('');
  const parsedDays = Number(days);
  const isValid =
    days.trim() === '' ||
    (Number.isInteger(parsedDays) && parsedDays >= MIN_DAYS && parsedDays <= MAX_DAYS);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        aria-label={`Nivel del daño para ${userName}`}
        className={`${INPUT_CLASSES} w-32`}
        value={level}
        onChange={(event) => setLevel(event.target.value as DamageLevel)}
      >
        {DAMAGE_LEVELS.map((value) => (
          <option key={value} value={value}>
            {DAMAGE_LEVEL_LABELS[value]}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={MIN_DAYS}
        max={MAX_DAYS}
        placeholder="Auto"
        aria-label={`Días de suspensión para ${userName}`}
        className={`${INPUT_CLASSES} w-20`}
        value={days}
        onChange={(event) => setDays(event.target.value)}
      />
      <span className="text-xs text-slate-500">días</span>
      <Button
        size="sm"
        disabled={disabled || !isValid}
        onClick={() => onConfirm(days.trim() === '' ? undefined : parsedDays, level)}
      >
        Confirmar
      </Button>
      <Button variant="danger" size="sm" disabled={disabled} onClick={onReject}>
        Rechazar
      </Button>
    </div>
  );
}
