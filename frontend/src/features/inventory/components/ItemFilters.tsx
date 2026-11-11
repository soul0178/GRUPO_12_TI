import { ITEM_STATUSES, ITEM_STATUS_LABELS } from '@/features/inventory/types/inventory';
import type { Category, ItemStatus } from '@/features/inventory/types/inventory';
import { INPUT_CLASSES } from '@/shared/components/FormField';

export interface FilterValues {
  text: string;
  categoryId: string;
  status: string;
}

interface ItemFiltersProps {
  values: FilterValues;
  categories: Category[];
  onChange: (values: FilterValues) => void;
}

const LABEL_CLASSES = 'mb-1.5 block text-sm font-medium text-slate-700';

/** Barra de filtros del catálogo: búsqueda por texto, categoría y estado. */
export function ItemFilters({ values, categories, onChange }: ItemFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label htmlFor="filter-text" className={LABEL_CLASSES}>
          Buscar
        </label>
        <input
          id="filter-text"
          type="search"
          placeholder="Código o nombre"
          className={INPUT_CLASSES}
          value={values.text}
          onChange={(event) => onChange({ ...values, text: event.target.value })}
        />
      </div>
      <div>
        <label htmlFor="filter-category" className={LABEL_CLASSES}>
          Categoría
        </label>
        <select
          id="filter-category"
          className={INPUT_CLASSES}
          value={values.categoryId}
          onChange={(event) => onChange({ ...values, categoryId: event.target.value })}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-status" className={LABEL_CLASSES}>
          Estado
        </label>
        <select
          id="filter-status"
          className={INPUT_CLASSES}
          value={values.status}
          onChange={(event) => onChange({ ...values, status: event.target.value })}
        >
          <option value="">Todos</option>
          {ITEM_STATUSES.map((status: ItemStatus) => (
            <option key={status} value={status}>
              {ITEM_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
