package edu.unsa.epcc.loans.report.dto;

/**
 * Resumen de un historial. {@code total = active + overdue + returned}. {@code returnedLate} y
 * {@code returnedDamaged} son subconjuntos de {@code returned}.
 */
public record LoanHistorySummary(
        long total,
        long active,
        long overdue,
        long returned,
        long returnedLate,
        long returnedDamaged) {
}
