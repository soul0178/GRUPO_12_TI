package edu.unsa.epcc.loans.sanction.entity;

/** Estado de una sanción. Solo las ACTIVE impiden reservar y recibir préstamos. */
public enum SanctionStatus {
    SUGGESTED,
    ACTIVE,
    FINISHED,
    REJECTED
}
