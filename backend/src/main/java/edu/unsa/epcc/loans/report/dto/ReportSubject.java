package edu.unsa.epcc.loans.report.dto;

/** Usuario o ítem al que pertenece un reporte: un nombre para el título y un detalle para el subtítulo. */
public record ReportSubject(Long id, String name, String detail) {
}
