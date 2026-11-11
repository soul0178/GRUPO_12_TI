import { useState } from 'react';
import { useItems } from '@/features/inventory/hooks/useItems';
import { ITEM_STATUS_LABELS } from '@/features/inventory/types/inventory';
import type { Item } from '@/features/inventory/types/inventory';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Badge } from '@/shared/components/Badge';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const RESULTS_SIZE = 8;

interface ReservableItemPickerProps {
  onSelect: (item: Item) => void;
}

/** Paso 1 de la reserva: busca ítems por código o nombre; los que no se pueden reservar salen deshabilitados. */
export function ReservableItemPicker({ onSelect }: ReservableItemPickerProps) {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 300);
  const items = useItems({ text: debounced }, 0, RESULTS_SIZE);

  return (
    <div className="space-y-2">
      <label htmlFor="reservation-item-search" className="block text-sm font-medium text-slate-700">
        Buscar ítem
      </label>
      <input
        id="reservation-item-search"
        type="search"
        placeholder="Código o nombre"
        className={INPUT_CLASSES}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {items.isError && <Alert variant="error">{getErrorMessage(items.error)}</Alert>}
      {items.data && items.data.content.length === 0 && (
        <p className="text-sm text-slate-500">No se encontraron ítems.</p>
      )}
      {items.data && items.data.content.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-inset ring-slate-200">
          {items.data.content.map((item) => {
            const reservable = item.status === 'AVAILABLE' || item.status === 'ON_LOAN';
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!reservable}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => onSelect(item)}
                >
                  <span>
                    <span className="font-medium text-slate-900">
                      {item.code} · {item.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {item.category.name} · máximo {item.category.maxLoanHours} h
                    </span>
                  </span>
                  <Badge tone={reservable ? 'green' : 'slate'}>
                    {ITEM_STATUS_LABELS[item.status]}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
