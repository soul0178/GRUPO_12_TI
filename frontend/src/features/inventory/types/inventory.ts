export type ItemStatus = 'AVAILABLE' | 'ON_LOAN' | 'OUT_OF_SERVICE' | 'RETIRED';

/** Nombre de cada estado para mostrar en pantalla. */
export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  AVAILABLE: 'Disponible',
  ON_LOAN: 'Prestado',
  OUT_OF_SERVICE: 'Fuera de servicio',
  RETIRED: 'De baja',
};

export const ITEM_STATUSES = Object.keys(ITEM_STATUS_LABELS) as ItemStatus[];

/** Estados que el personal puede asignar manualmente al editar un ítem. */
export const MANUAL_ITEM_STATUSES: ItemStatus[] = ['AVAILABLE', 'OUT_OF_SERVICE'];

export interface Category {
  id: number;
  name: string;
  maxLoanHours: number;
  requiresGuarantee: boolean;
}

export interface UpdateCategoryRequest {
  maxLoanHours: number;
  requiresGuarantee: boolean;
}

export interface Item {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: Category;
  status: ItemStatus;
  createdAt: string;
}

export interface CreateItemRequest {
  code: string;
  name: string;
  description?: string;
  categoryId: number;
}

export interface UpdateItemRequest extends CreateItemRequest {
  status: ItemStatus;
}

/** Filtros opcionales del catálogo. */
export interface ItemFilters {
  text?: string;
  categoryId?: number;
  status?: ItemStatus;
}
