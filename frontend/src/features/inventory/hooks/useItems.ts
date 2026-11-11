import { useQuery } from '@tanstack/react-query';
import { getItem, getItems } from '@/features/inventory/api/inventoryApi';
import type { ItemFilters } from '@/features/inventory/types/inventory';

/** Consulta una página del catálogo de ítems con los filtros indicados. */
export function useItems(filters: ItemFilters, page: number, size: number) {
  return useQuery({
    queryKey: ['items', filters, page, size],
    queryFn: () => getItems(filters, page, size),
  });
}

/** Consulta un ítem por id; se desactiva si no hay id (formulario de alta). */
export function useItem(id: number | undefined) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => getItem(id as number),
    enabled: id !== undefined,
  });
}
