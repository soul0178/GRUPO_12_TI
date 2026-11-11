import type {
  Category,
  CreateItemRequest,
  Item,
  ItemFilters,
  UpdateCategoryRequest,
  UpdateItemRequest,
} from '@/features/inventory/types/inventory';
import { apiClient } from '@/shared/api/apiClient';
import type { Page } from '@/shared/types/api';

/** Llama a GET /items con los filtros y la paginación indicados. */
export async function getItems(
  filters: ItemFilters,
  page: number,
  size: number,
): Promise<Page<Item>> {
  const params = {
    page,
    size,
    text: filters.text || undefined,
    categoryId: filters.categoryId,
    status: filters.status,
  };
  const { data } = await apiClient.get<Page<Item>>('/items', { params });
  return data;
}

/** Llama a GET /items/{id}. */
export async function getItem(id: number): Promise<Item> {
  const { data } = await apiClient.get<Item>(`/items/${id}`);
  return data;
}

/** Llama a POST /items (personal). */
export async function createItem(request: CreateItemRequest): Promise<Item> {
  const { data } = await apiClient.post<Item>('/items', request);
  return data;
}

/** Llama a PUT /items/{id} (personal). */
export async function updateItem(id: number, request: UpdateItemRequest): Promise<Item> {
  const { data } = await apiClient.put<Item>(`/items/${id}`, request);
  return data;
}

/** Llama a POST /items/{id}/retire (personal). */
export async function retireItem(id: number): Promise<Item> {
  const { data } = await apiClient.post<Item>(`/items/${id}/retire`);
  return data;
}

/** Llama a GET /categories. */
export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories');
  return data;
}

/** Llama a PUT /categories/{id} (solo ADMIN). */
export async function updateCategory(
  id: number,
  request: UpdateCategoryRequest,
): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/categories/${id}`, request);
  return data;
}
