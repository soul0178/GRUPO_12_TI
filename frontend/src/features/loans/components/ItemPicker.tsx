import { useState } from 'react';
import { useItems } from '@/features/inventory/hooks/useItems';
import type { Item } from '@/features/inventory/types/inventory';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

/** En la entrega se muestran pocos resultados; en los reportes, todos los ítems (con scroll). */
const AVAILABLE_RESULTS_SIZE = 8;
const ALL_RESULTS_SIZE = 100;

interface ItemPickerProps {
  selected: Item | null;
  onSelect: (item: Item | null) => void;
  /** Si es false, lista todos los ítems sin importar su estado, desde el inicio (reportes). Por defecto, solo disponibles. */
  availableOnly?: boolean;
}

/** Busca ítems por código o nombre y permite elegir uno (para la entrega o para un reporte). */
export function ItemPicker({ selected, onSelect, availableOnly = true }: ItemPickerProps) {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 300);
  const items = useItems(
    { text: debounced, status: availableOnly ? 'AVAILABLE' : undefined },
    0,
    availableOnly ? AVAILABLE_RESULTS_SIZE : ALL_RESULTS_SIZE,
  );

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
        <div>
          <p className="font-medium text-slate-900">
            {selected.code} · {selected.name}
          </p>
          <p className="text-xs text-slate-500">
            {selected.category.name} · plazo {selected.category.maxLoanHours} h
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setText('');
            onSelect(null);
          }}
        >
          Cambiar ítem
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="item-search" className="block text-sm font-medium text-slate-700">
        {availableOnly ? 'Buscar ítem disponible' : 'Buscar ítem'}
      </label>
      <input
        id="item-search"
        type="search"
        placeholder="Código o nombre"
        className={INPUT_CLASSES}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {items.isError && <Alert variant="error">{getErrorMessage(items.error)}</Alert>}
      {items.data && items.data.content.length === 0 && (
        <p className="text-sm text-slate-500">
          {availableOnly
            ? 'No hay ítems disponibles con ese criterio.'
            : 'No se encontraron ítems.'}
        </p>
      )}
      {items.data && items.data.content.length > 0 && (
        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-inset ring-slate-200">
          {items.data.content.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => onSelect(item)}
              >
                <span>
                  <span className="font-medium text-slate-900">
                    {item.code} · {item.name}
                  </span>
                  <span className="block text-xs text-slate-500">{item.category.name}</span>
                </span>
                {item.category.requiresGuarantee && <Badge tone="amber">Exige garantía</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
