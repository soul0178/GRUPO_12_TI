package edu.unsa.epcc.loans.reservation.dto;

import java.time.Instant;
import java.util.List;

/** Disponibilidad de un ítem en un rango: si está libre y qué tramos lo ocupan. */
public record AvailabilityResponse(
        Long itemId,
        Instant from,
        Instant to,
        boolean available,
        List<BusyRangeResponse> busyRanges) {
}
