package edu.unsa.epcc.loans.loan.repository;

/** Conteos de un historial de préstamos, calculados por la base en una sola consulta. */
public interface LoanHistoryCounts {

    /** Todos los préstamos del historial. */
    Long getTotalLoans();

    /** Sin devolver y dentro del plazo. */
    Long getActiveLoans();

    /** Sin devolver y con el plazo vencido. */
    Long getOverdueLoans();

    /** Ya devueltos. */
    Long getReturnedLoans();

    /** Devueltos después de la fecha límite. */
    Long getLateReturns();

    /** Devueltos con el estado físico "dañado". */
    Long getDamagedReturns();
}
