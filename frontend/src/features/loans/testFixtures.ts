import type { Loan } from '@/features/loans/types/loan';

/** Préstamo de ejemplo para las pruebas; se pueden sobreescribir campos. */
export function loanFixture(overrides: Partial<Loan> = {}): Loan {
  return {
    id: 1,
    userId: 20,
    userFullName: 'Luis Quispe',
    userEmail: 'luis@epcc.unsa.edu.pe',
    itemId: 5,
    itemCode: 'EQ-001',
    itemName: 'Laptop',
    categoryName: 'Equipo',
    deliveredByName: 'Ana Pérez',
    returnedByName: null,
    checkedOutAt: '2026-03-10T15:00:00Z',
    dueAt: '2026-03-10T19:00:00Z',
    returnedAt: null,
    deliveryCondition: 'GOOD',
    returnCondition: null,
    deliveryObservations: null,
    returnObservations: null,
    status: 'ACTIVE',
    guarantee: { type: 'DNI', description: 'DNI 12345678', returned: false },
    ...overrides,
  };
}

/** Respuesta paginada de una sola página. */
export function pageOf<T>(content: T[]) {
  return { content, page: 0, size: 10, totalElements: content.length, totalPages: 1 };
}
