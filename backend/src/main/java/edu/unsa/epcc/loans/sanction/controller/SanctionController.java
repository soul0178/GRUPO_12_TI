package edu.unsa.epcc.loans.sanction.controller;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.security.AuthenticatedUser;
import edu.unsa.epcc.loans.sanction.dto.ConfirmSanctionRequest;
import edu.unsa.epcc.loans.sanction.dto.LiftSanctionRequest;
import edu.unsa.epcc.loans.sanction.dto.ReduceSanctionRequest;
import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import edu.unsa.epcc.loans.sanction.service.SanctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Sanciones: el personal las consulta, el ADMIN confirma o rechaza las sugeridas y cada usuario ve las suyas. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SanctionController {

    private final SanctionService sanctionService;

    /** Lista las sanciones de todos los usuarios, con filtro opcional de estado y de usuario (text). */
    @GetMapping("/sanctions")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public PageResponse<SanctionResponse> findAll(
            @RequestParam(required = false) SanctionStatus status,
            @RequestParam(required = false) String text,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return sanctionService.findAll(status, text, pageable);
    }

    /** Lista las sanciones del usuario autenticado, con filtro opcional de estado. */
    @GetMapping("/me/sanctions")
    @PreAuthorize("isAuthenticated()")
    public PageResponse<SanctionResponse> findMine(
            @AuthenticationPrincipal AuthenticatedUser current,
            @RequestParam(required = false) SanctionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return sanctionService.findByUser(current.id(), status, pageable);
    }

    /** Confirma una sanción de daño sugerida (días y nivel opcionales; sin días se aplica la política). */
    @PostMapping("/sanctions/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public SanctionResponse confirm(@PathVariable Long id, @Valid @RequestBody ConfirmSanctionRequest request) {
        return sanctionService.confirm(id, request.days(), request.damageLevel());
    }

    /** Levanta una sanción activa (ADMIN); si causó un baneo, reactiva al usuario. */
    @PostMapping("/sanctions/{id}/lift")
    @PreAuthorize("hasRole('ADMIN')")
    public SanctionResponse lift(@PathVariable Long id, @Valid @RequestBody LiftSanctionRequest request) {
        return sanctionService.lift(id, request.reason());
    }

    /** Reduce la duración total de una sanción activa (ADMIN). */
    @PostMapping("/sanctions/{id}/reduce")
    @PreAuthorize("hasRole('ADMIN')")
    public SanctionResponse reduce(@PathVariable Long id, @Valid @RequestBody ReduceSanctionRequest request) {
        return sanctionService.reduce(id, request.days(), request.reason());
    }

    /** Rechaza una sanción sugerida. */
    @PostMapping("/sanctions/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public SanctionResponse reject(@PathVariable Long id) {
        return sanctionService.reject(id);
    }
}
