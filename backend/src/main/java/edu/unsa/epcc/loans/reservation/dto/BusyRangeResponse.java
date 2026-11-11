package edu.unsa.epcc.loans.reservation.dto;

import java.time.Instant;

/** Tramo en que el ítem está ocupado, por una reserva pendiente o por un préstamo en curso. */
public record BusyRangeResponse(Instant startAt, Instant endAt, BusyType type) {

    public enum BusyType { RESERVATION, LOAN }
}
