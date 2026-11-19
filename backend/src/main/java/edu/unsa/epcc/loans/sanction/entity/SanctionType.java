package edu.unsa.epcc.loans.sanction.entity;

/**
 * Motivo de la sanción: devolución tardía (OVERDUE), daño del ítem (DAMAGE), no recoger una reserva (NO_SHOW, la más
 * leve) o pérdida del ítem (LOSS, la más severa).
 */
public enum SanctionType {
    OVERDUE,
    DAMAGE,
    NO_SHOW,
    LOSS
}
