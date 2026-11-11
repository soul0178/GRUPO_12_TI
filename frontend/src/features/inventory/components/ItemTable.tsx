import { Link } from 'react-router-dom';
import { ITEM_STATUS_LABELS } from '@/features/inventory/types/inventory';
import type { Item, ItemStatus } from '@/features/inventory/types/inventory';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

interface ItemTableProps {
  items: Item[];
  /** Si es true (personal) se muestran las acciones de editar y dar de baja. */
  showActions: boolean;
  onRetire: (item: Item) => void;
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

const STATUS_TONES: Record<ItemStatus, 'green' | 'amber' | 'slate' | 'red'> = {
  AVAILABLE: 'green',
  ON_LOAN: 'amber',
  OUT_OF_SERVICE: 'red',
  RETIRED: 'slate',
};

/** Tabla del catálogo de ítems; el personal ve además las acciones de editar y dar de baja. */
export function ItemTable({ items, showActions, onRetire }: ItemTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={HEADER_CLASSES}>Código</th>
            <th className={HEADER_CLASSES}>Nombre</th>
            <th className={HEADER_CLASSES}>Categoría</th>
            <th className={HEADER_CLASSES}>Estado</th>
            {showActions && <th className={`${HEADER_CLASSES} text-right`}>Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.code}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{item.category.name}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONES[item.status]}>{ITEM_STATUS_LABELS[item.status]}</Badge>
              </td>
              {showActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    {item.status !== 'RETIRED' && (
                      <Link to={`/items/${item.id}/edit`} className={TEXT_LINK_CLASSES}>
                        Editar
                      </Link>
                    )}
                    {(item.status === 'AVAILABLE' || item.status === 'OUT_OF_SERVICE') && (
                      <Button variant="danger" size="sm" onClick={() => onRetire(item)}>
                        Dar de baja
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
