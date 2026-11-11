package edu.unsa.epcc.loans.loan.controller;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.security.AuthenticatedUser;
import edu.unsa.epcc.loans.loan.dto.CreateLoanRequest;
import edu.unsa.epcc.loans.loan.dto.LoanResponse;
import edu.unsa.epcc.loans.loan.dto.ReturnLoanRequest;
import edu.unsa.epcc.loans.loan.entity.LoanStatus;
import edu.unsa.epcc.loans.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Entrega y devolución de ítems, solo para el personal (MANAGER y ADMIN) (RF-04). */
@RestController
@RequestMapping("/api/loans")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    /** Registra la entrega de un ítem a un usuario. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse create(@Valid @RequestBody CreateLoanRequest request,
                               @AuthenticationPrincipal AuthenticatedUser current) {
        return loanService.create(request, current.id());
    }

    /** Registra la devolución de un préstamo. */
    @PostMapping("/{id}/return")
    public LoanResponse returnLoan(@PathVariable Long id, @Valid @RequestBody ReturnLoanRequest request,
                                   @AuthenticationPrincipal AuthenticatedUser current) {
        return loanService.returnLoan(id, request, current.id());
    }

    /** Lista préstamos con filtros opcionales de usuario, ítem y estado (ACTIVE, OVERDUE o RETURNED). */
    @GetMapping
    public PageResponse<LoanResponse> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) LoanStatus status,
            @PageableDefault(size = 20, sort = "checkedOutAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return loanService.search(userId, itemId, status, pageable);
    }

    /** Devuelve un préstamo por id. */
    @GetMapping("/{id}")
    public LoanResponse findById(@PathVariable Long id) {
        return loanService.findById(id);
    }
}
