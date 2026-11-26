package edu.unsa.epcc.loans.report.dto;

/**
 * Resumen de un historial. {@code total = active + overdue + returned}. {@code returned} son todas las
 * devoluciones y {@code returnedNormal + returnedDamaged + returnedLost = returned}. {@code returnedLate} es un
 * subconjunto de {@code returned}.
 */
public record LoanHistorySummary(
        long total,
        long active,
        long overdue,
        long returned,
        long returnedLate,
        long returnedNormal,
        long returnedDamaged,
        long returnedLost) {
}
