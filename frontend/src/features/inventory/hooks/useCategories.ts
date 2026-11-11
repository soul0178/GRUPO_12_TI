import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategories, updateCategory } from '@/features/inventory/api/inventoryApi';
import type { UpdateCategoryRequest } from '@/features/inventory/types/inventory';

/** Consulta todas las categorías (se usan en filtros, formularios y en la pantalla de políticas). */
export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories });
}

/** Actualiza el plazo y la garantía de una categoría (ADMIN) y refresca la lista. */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateCategoryRequest }) =>
      updateCategory(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
