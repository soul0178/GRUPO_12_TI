package edu.unsa.epcc.loans.reservation.dto;

import edu.unsa.epcc.loans.reservation.entity.ReservationStatus;
import java.time.Instant;

public record ReservationResponse(
        Long id,
        Long userId,
        String userFullName,
        String userEmail,
        Long itemId,
        String itemCode,
        String itemName,
        String categoryName,
        Instant startAt,
        Instant endAt,
        ReservationStatus status,
        Instant createdAt) {
}
