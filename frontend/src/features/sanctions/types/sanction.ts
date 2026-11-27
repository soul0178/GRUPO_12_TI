export type SanctionType = 'OVERDUE' | 'DAMAGE' | 'NO_SHOW' | 'LOSS';
export type SanctionStatus = 'SUGGESTED' | 'ACTIVE' | 'FINISHED' | 'REJECTED' | 'LIFTED';
export type DamageLevel = 'MINOR' | 'MODERATE' | 'SEVERE';

export const SANCTION_TYPE_LABELS: Record<SanctionType, string> = {
  OVERDUE: 'Atraso',
  DAMAGE: 'Daño',
  NO_SHOW: 'Reserva no recogida',
  LOSS: 'Pérdida',
};

export const SANCTION_TYPES = Object.keys(SANCTION_TYPE_LABELS) as SanctionType[];

export const SANCTION_STATUS_LABELS: Record<SanctionStatus, string> = {
  SUGGESTED: 'Sugerida',
  ACTIVE: 'Activa',
  FINISHED: 'Finalizada',
  REJECTED: 'Rechazada',
  LIFTED: 'Levantada',
};

export const SANCTION_STATUSES = Object.keys(SANCTION_STATUS_LABELS) as SanctionStatus[];

export const DAMAGE_LEVEL_LABELS: Record<DamageLevel, string> = {
  MINOR: 'Leve',
  MODERATE: 'Moderado',
  SEVERE: 'Extremo',
};

export const DAMAGE_LEVELS = Object.keys(DAMAGE_LEVEL_LABELS) as DamageLevel[];

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
  /** Préstamo de origen (atraso, daño, pérdida); vacío si nació de una reserva. */
  loanId: number | null;
  /** Reserva no recogida de origen (NO_SHOW). */
  reservationId?: number | null;
  damageLevel?: DamageLevel | null;
  /** Verdadero si esta sanción llevó al baneo del usuario. */
  causedBan?: boolean;
  /** Motivo que escribió el administrador al levantar o reducir la sanción. */
  adminNote?: string | null;
  createdAt: string;
}

export interface PolicySettings {
  maxActiveItems: number;
  reservationExpirationMinutes: number;
}
