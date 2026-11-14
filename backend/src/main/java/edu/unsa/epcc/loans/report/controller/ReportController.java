package edu.unsa.epcc.loans.report.controller;

import edu.unsa.epcc.loans.loan.entity.LoanStatus;
import edu.unsa.epcc.loans.report.dto.LoanHistoryReport;
import edu.unsa.epcc.loans.report.service.ReportService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Reportes de préstamos, solo para el personal (MANAGER y ADMIN). */
@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * Historial de préstamos de un usuario. {@code from} y {@code to} son fechas yyyy-MM-dd en hora de Lima,
     * ambas inclusive; {@code status} es ACTIVE, OVERDUE o RETURNED. Todos son opcionales.
     */
    @GetMapping("/users/{userId}/loans")
    public LoanHistoryReport userHistory(
            @PathVariable Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) LoanStatus status,
            @PageableDefault(size = 20, sort = "checkedOutAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return reportService.userHistory(userId, from, to, status, pageable);
    }

    /** Historial de préstamos de un ítem, con los mismos filtros que el del usuario. */
    @GetMapping("/items/{itemId}/loans")
    public LoanHistoryReport itemHistory(
            @PathVariable Long itemId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) LoanStatus status,
            @PageableDefault(size = 20, sort = "checkedOutAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return reportService.itemHistory(itemId, from, to, status, pageable);
    }
}
