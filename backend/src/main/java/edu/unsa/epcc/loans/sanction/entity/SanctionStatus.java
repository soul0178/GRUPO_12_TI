package edu.unsa.epcc.loans.sanction.entity;

/** Estado de una sanción. Solo las ACTIVE impiden reservar y recibir préstamos. LIFTED: la levantó un ADMIN. */
public enum SanctionStatus {
    SUGGESTED,
    ACTIVE,
    FINISHED,
    REJECTED,
    LIFTED
}
