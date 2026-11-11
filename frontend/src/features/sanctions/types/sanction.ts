export type SanctionType = 'OVERDUE' | 'DAMAGE';
export type SanctionStatus = 'SUGGESTED' | 'ACTIVE' | 'FINISHED' | 'REJECTED';

export const SANCTION_TYPE_LABELS: Record<SanctionType, string> = {
  OVERDUE: 'Atraso',
  DAMAGE: 'Daño',
};

export const SANCTION_STATUS_LABELS: Record<SanctionStatus, string> = {
  SUGGESTED: 'Sugerida',
  ACTIVE: 'Activa',
  FINISHED: 'Finalizada',
  REJECTED: 'Rechazada',
};

export const SANCTION_STATUSES = Object.keys(SANCTION_STATUS_LABELS) as SanctionStatus[];

/** Sanción tal como la devuelve el backend (SanctionResponse). */
export interface Sanction {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  type: SanctionType;
  status: SanctionStatus;
  startAt: string | null;
  endAt: string | null;
  reason: string;
  loanId: number;
  createdAt: string;
}

export interface PolicySettings {
  maxActiveItems: number;
  reservationExpirationMinutes: number;
}
