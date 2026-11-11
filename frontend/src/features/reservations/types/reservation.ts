export type ReservationStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
export type BusyType = 'RESERVATION' | 'LOAN';

/** Nombre de cada estado de reserva para mostrar en pantalla. */
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  FULFILLED: 'Cumplida',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

export const BUSY_TYPE_LABELS: Record<BusyType, string> = {
  RESERVATION: 'Reservado',
  LOAN: 'Prestado',
};

export interface Reservation {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  categoryName: string;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface CreateReservationRequest {
  itemId: number;
  startAt: string;
  endAt: string;
}

export interface BusyRange {
  startAt: string;
  endAt: string;
  type: BusyType;
}

export interface Availability {
  itemId: number;
  from: string;
  to: string;
  available: boolean;
  busyRanges: BusyRange[];
}
