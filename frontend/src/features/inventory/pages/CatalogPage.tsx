import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIsStaff } from '@/features/auth/hooks/useIsStaff';
import { ItemFilters } from '@/features/inventory/components/ItemFilters';
import type { FilterValues } from '@/features/inventory/components/ItemFilters';
import { ItemTable } from '@/features/inventory/components/ItemTable';
import { useCategories } from '@/features/inventory/hooks/useCategories';
import { useRetireItem } from '@/features/inventory/hooks/useItemMutations';
import { useItems } from '@/features/inventory/hooks/useItems';
import type { Item, ItemStatus } from '@/features/inventory/types/inventory';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { PRIMARY_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 300;

/** Catálogo de ítems con búsqueda y filtros para todos los roles; el personal puede además gestionarlo (RF-03). */
export function CatalogPage() {
  const isStaff = useIsStaff();
  const [filters, setFilters] = useState<FilterValues>({ text: '', categoryId: '', status: '' });
  const [page, setPage] = useState(0);
  const [itemToRetire, setItemToRetire] = useState<Item | null>(null);
  const debouncedText = useDebouncedValue(filters.text, SEARCH_DELAY_MS);

  const categories = useCategories();
  const items = useItems(
    {
      text: debouncedText,
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      status: (filters.status || undefined) as ItemStatus | undefined,
    },
    page,
    PAGE_SIZE,
  );
  const retire = useRetireItem();

  function handleFiltersChange(values: FilterValues) {
    setFilters(values);
    setPage(0);
  }

  function confirmRetire() {
    if (itemToRetire) {
      retire.mutate(itemToRetire.id, { onSettled: () => setItemToRetire(null) });
    }
  }

  return (
    <section>
      <PageHeader
        title="Catálogo"
        description="Equipos, libros y objetos disponibles en la escuela."
        actions={
          isStaff && (
            <Link to="/items/new" className={PRIMARY_LINK_CLASSES}>
              Nuevo ítem
            </Link>
          )
        }
      />

      <div className="space-y-4">
        <Card className="p-4">
          <ItemFilters
            values={filters}
            categories={categories.data ?? []}
            onChange={handleFiltersChange}
          />
        </Card>

        {itemToRetire && (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4 ring-red-200">
            <p className="text-sm text-slate-700">
              {`¿Dar de baja el ítem ${itemToRetire.code} (${itemToRetire.name})? Esta acción no se puede deshacer.`}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setItemToRetire(null)}>
                Cancelar
              </Button>
              <Button size="sm" disabled={retire.isPending} onClick={confirmRetire}>
                Confirmar baja
              </Button>
            </div>
          </Card>
        )}

        {retire.isError && <Alert variant="error">{getErrorMessage(retire.error)}</Alert>}
        {items.isError && <Alert variant="error">{getErrorMessage(items.error)}</Alert>}
        {items.isLoading && <LoadingState message="Cargando catálogo..." />}
        {items.data && items.data.content.length === 0 && (
          <EmptyState message="No se encontraron ítems." />
        )}
        {items.data && items.data.content.length > 0 && (
          <Card className="overflow-hidden">
            <ItemTable
              items={items.data.content}
              showActions={isStaff}
              onRetire={setItemToRetire}
            />
            <Pagination page={page} totalPages={items.data.totalPages} onPageChange={setPage} />
          </Card>
        )}
      </div>
    </section>
  );
}
