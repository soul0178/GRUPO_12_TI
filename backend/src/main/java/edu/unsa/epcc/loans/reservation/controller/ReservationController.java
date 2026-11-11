package edu.unsa.epcc.loans.reservation.controller;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.security.AuthenticatedUser;
import edu.unsa.epcc.loans.reservation.dto.AvailabilityResponse;
import edu.unsa.epcc.loans.reservation.dto.CreateReservationRequest;
import edu.unsa.epcc.loans.reservation.dto.ReservationResponse;
import edu.unsa.epcc.loans.reservation.entity.ReservationStatus;
import edu.unsa.epcc.loans.reservation.service.ReservationService;
import jakarta.validation.Valid;
import java.time.Instant;
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

/** Reservas: cualquier usuario autenticado reserva y consulta las suyas; el personal ve todas (RF-05). */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    /** Consulta si un ítem está libre en un rango y qué tramos lo ocupan. */
    @GetMapping("/items/{id}/availability")
    public AvailabilityResponse availability(@PathVariable Long id, @RequestParam Instant from,
                                             @RequestParam Instant to) {
        return reservationService.availability(id, from, to);
    }

    /** Crea una reserva a nombre del usuario autenticado. */
    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@Valid @RequestBody CreateReservationRequest request,
                                      @AuthenticationPrincipal AuthenticatedUser current) {
        return reservationService.create(request, current.id());
    }

    /** Cancela una reserva pendiente del usuario autenticado. */
    @PostMapping("/reservations/{id}/cancel")
    public ReservationResponse cancel(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser current) {
        return reservationService.cancel(id, current.id());
    }

    /** Lista las reservas del usuario autenticado, con filtro opcional de estado. */
    @GetMapping("/me/reservations")
    public PageResponse<ReservationResponse> mine(
            @RequestParam(required = false) ReservationStatus status,
            @PageableDefault(size = 20, sort = "startAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser current) {
        return reservationService.search(current.id(), null, status, pageable);
    }

    /** Lista todas las reservas con filtros opcionales de usuario, ítem y estado (personal). */
    @GetMapping("/reservations")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public PageResponse<ReservationResponse> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) ReservationStatus status,
            @PageableDefault(size = 20, sort = "startAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return reservationService.search(userId, itemId, status, pageable);
    }
}
