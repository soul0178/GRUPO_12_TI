import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { INPUT_CLASSES } from '@/shared/components/FormField';

const MIN_DAYS = 1;
const MAX_DAYS = 365;

interface ActiveActionsProps {
  userName: string;
  /** Un baneo solo se puede levantar, no reducir. */
  canReduce: boolean;
  disabled: boolean;
  onLift: (reason: string) => void;
  onReduce: (days: number, reason: string) => void;
}

type Mode = 'lift' | 'reduce' | null;

/** Controles de una sanción activa: Reducir (nueva duración total) o Levantar, siempre con un motivo (ADMIN). */
export function ActiveActions({ userName, canReduce, disabled, onLift, onReduce }: ActiveActionsProps) {
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('');
  const parsedDays = Number(days);
  const daysValid = Number.isInteger(parsedDays) && parsedDays >= MIN_DAYS && parsedDays <= MAX_DAYS;
  const canSubmit = reason.trim() !== '' && (mode === 'lift' || daysValid);

  function close() {
    setMode(null);
    setReason('');
    setDays('');
  }

  if (mode === null) {
    return (
      <div className="flex items-center justify-end gap-2">
        {canReduce && (
          <Button variant="secondary" size="sm" disabled={disabled} onClick={() => setMode('reduce')}>
            Reducir
          </Button>
        )}
        <Button variant="danger" size="sm" disabled={disabled} onClick={() => setMode('lift')}>
          Levantar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {mode === 'reduce' && (
        <>
          <input
            type="number"
            min={MIN_DAYS}
            max={MAX_DAYS}
            aria-label={`Nueva duración total en días para ${userName}`}
            placeholder="Días"
            className={`${INPUT_CLASSES} w-20`}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          <span className="text-xs text-slate-500">días en total</span>
        </>
      )}
      <input
        type="text"
        maxLength={500}
        aria-label={`Motivo para ${userName}`}
        placeholder="Motivo"
        className={`${INPUT_CLASSES} w-48`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <Button
        size="sm"
        disabled={disabled || !canSubmit}
        onClick={() => {
          if (mode === 'lift') {
            onLift(reason.trim());
          } else {
            onReduce(parsedDays, reason.trim());
          }
          close();
        }}
      >
        {mode === 'lift' ? 'Confirmar levantamiento' : 'Confirmar reducción'}
      </Button>
      <Button variant="secondary" size="sm" onClick={close}>
        Cancelar
      </Button>
    </div>
  );
}
