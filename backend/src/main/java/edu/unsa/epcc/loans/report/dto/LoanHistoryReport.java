package edu.unsa.epcc.loans.report.dto;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.loan.dto.LoanResponse;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Historial de préstamos de un usuario o de un ítem. {@code from} y {@code to} son las fechas (hora de Lima, ambas
 * inclusive) con que se filtró, o null si no hubo límite. El resumen cubre todo el rango; {@code loans} además
 * respeta el filtro de estado.
 */
public record LoanHistoryReport(
        ReportSubject subject,
        LocalDate from,
        LocalDate to,
        Instant generatedAt,
        LoanHistorySummary summary,
        PageResponse<LoanResponse> loans) {
}
