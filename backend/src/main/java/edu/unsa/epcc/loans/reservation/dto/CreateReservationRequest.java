package edu.unsa.epcc.loans.reservation.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateReservationRequest(
        @NotNull(message = "El ítem es obligatorio") Long itemId,
        @NotNull(message = "La fecha de inicio es obligatoria") Instant startAt,
        @NotNull(message = "La fecha de fin es obligatoria") Instant endAt) {
}
