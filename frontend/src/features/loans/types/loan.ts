export type PhysicalCondition = 'GOOD' | 'FAIR' | 'DAMAGED';
export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED';
export type GuaranteeType = 'DNI' | 'UNIVERSITY_ID' | 'OTHER';

/** Nombre de cada estado físico para mostrar en pantalla. */
export const CONDITION_LABELS: Record<PhysicalCondition, string> = {
  GOOD: 'Bueno',
  FAIR: 'Regular',
  DAMAGED: 'Dañado',
};

export const CONDITIONS = Object.keys(CONDITION_LABELS) as PhysicalCondition[];

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  ACTIVE: 'Activo',
  OVERDUE: 'Vencido',
  RETURNED: 'Devuelto',
};

export const LOAN_STATUSES = Object.keys(LOAN_STATUS_LABELS) as LoanStatus[];

export const GUARANTEE_TYPE_LABELS: Record<GuaranteeType, string> = {
  DNI: 'DNI',
  UNIVERSITY_ID: 'Carnet universitario',
  OTHER: 'Otro',
};

export const GUARANTEE_TYPES = Object.keys(GUARANTEE_TYPE_LABELS) as GuaranteeType[];

/** Indica si el estado al devolver es peor que al entregar (posible daño, RF-07). */
export function isWorseCondition(
  delivery: PhysicalCondition,
  returned: PhysicalCondition,
): boolean {
  return CONDITIONS.indexOf(returned) > CONDITIONS.indexOf(delivery);
}

export interface Guarantee {
  type: GuaranteeType;
  description: string;
  returned: boolean;
}

export interface Loan {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  categoryName: string;
  deliveredByName: string;
  returnedByName: string | null;
  checkedOutAt: string;
  dueAt: string;
  returnedAt: string | null;
  deliveryCondition: PhysicalCondition;
  returnCondition: PhysicalCondition | null;
  deliveryObservations: string | null;
  returnObservations: string | null;
  status: LoanStatus;
  guarantee: Guarantee | null;
}

export interface CreateLoanRequest {
  userId: number;
  itemId: number;
  deliveryCondition: PhysicalCondition;
  deliveryObservations?: string;
  guarantee?: { type: GuaranteeType; description: string };
}

export interface ReturnLoanRequest {
  returnCondition: PhysicalCondition;
  returnObservations?: string;
}

/** Filtros opcionales del listado de préstamos. */
export interface LoanFilters {
  status?: LoanStatus;
}
