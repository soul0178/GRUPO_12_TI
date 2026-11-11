import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, retireItem, updateItem } from '@/features/inventory/api/inventoryApi';
import type { UpdateItemRequest } from '@/features/inventory/types/inventory';

/** Da de alta un ítem y refresca el catálogo. */
export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}

/** Modifica un ítem y refresca el catálogo. */
export function useUpdateItem(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateItemRequest) => updateItem(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}

/** Da de baja un ítem y refresca el catálogo. */
export function useRetireItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retireItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
