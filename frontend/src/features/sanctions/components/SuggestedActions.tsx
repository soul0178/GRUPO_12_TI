import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { INPUT_CLASSES } from '@/shared/components/FormField';

const MIN_DAYS = 1;
const MAX_DAYS = 365;

interface SuggestedActionsProps {
  /** Nombre del usuario sancionado, para el texto accesible del campo. */
  userName: string;
  disabled: boolean;
  onConfirm: (days: number) => void;
  onReject: () => void;
}

/** Controles de una sanción sugerida: días de suspensión y botones Confirmar / Rechazar (ADMIN). */
export function SuggestedActions({
  userName,
  disabled,
  onConfirm,
  onReject,
}: SuggestedActionsProps) {
  const [days, setDays] = useState('1');
  const parsedDays = Number(days);
  const isValid = Number.isInteger(parsedDays) && parsedDays >= MIN_DAYS && parsedDays <= MAX_DAYS;

  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number"
        min={MIN_DAYS}
        max={MAX_DAYS}
        aria-label={`Días de suspensión para ${userName}`}
        className={`${INPUT_CLASSES} w-20`}
        value={days}
        onChange={(event) => setDays(event.target.value)}
      />
      <span className="text-xs text-slate-500">días</span>
      <Button size="sm" disabled={disabled || !isValid} onClick={() => onConfirm(parsedDays)}>
        Confirmar
      </Button>
      <Button variant="danger" size="sm" disabled={disabled} onClick={onReject}>
        Rechazar
      </Button>
    </div>
  );
}
