package edu.unsa.epcc.loans.loan.entity;

/** Estado de un préstamo. No se guarda: se calcula con la fecha de devolución y el vencimiento. */
public enum LoanStatus {
    ACTIVE,
    OVERDUE,
    RETURNED
}
