import { useState } from 'react';
import { useUserLookup } from '@/features/users/hooks/useUsers';
import { ROLE_LABELS } from '@/features/users/types/user';
import type { UserSummary } from '@/features/users/types/user';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

interface UserPickerProps {
  selected: UserSummary | null;
  onSelect: (user: UserSummary | null) => void;
}

/** Busca un usuario por nombre, correo o código/DNI y permite elegirlo para la entrega. */
export function UserPicker({ selected, onSelect }: UserPickerProps) {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 300);
  const lookup = useUserLookup(debounced);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
        <div>
          <p className="font-medium text-slate-900">
            {selected.firstName} {selected.lastName}
          </p>
          <p className="text-xs text-slate-500">
            {selected.email} · {selected.documentNumber} · {ROLE_LABELS[selected.role]}
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
          Cambiar usuario
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="user-search" className="block text-sm font-medium text-slate-700">
        Buscar usuario
      </label>
      <input
        id="user-search"
        type="search"
        placeholder="Nombre, correo o código/DNI"
        className={INPUT_CLASSES}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {lookup.isError && <Alert variant="error">{getErrorMessage(lookup.error)}</Alert>}
      {lookup.data && lookup.data.length === 0 && (
        <p className="text-sm text-slate-500">No se encontraron usuarios.</p>
      )}
      {lookup.data && lookup.data.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-inset ring-slate-200">
          {lookup.data.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => onSelect(user)}
              >
                <span>
                  <span className="font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {user.email} · {user.documentNumber}
                  </span>
                </span>
                {!user.active && <Badge tone="red">Desactivado</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
