import type { Reservation } from '@/features/reservations/types/reservation';

/** Reserva de ejemplo para las pruebas; se pueden sobreescribir campos. */
export function reservationFixture(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    userId: 1,
    userFullName: 'Ana Pérez',
    userEmail: 'ana@epcc.unsa.edu.pe',
    itemId: 5,
    itemCode: 'EQ-001',
    itemName: 'Laptop',
    categoryName: 'Equipo',
    startAt: '2030-03-10T15:00:00Z',
    endAt: '2030-03-10T17:00:00Z',
    status: 'PENDING',
    createdAt: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}
