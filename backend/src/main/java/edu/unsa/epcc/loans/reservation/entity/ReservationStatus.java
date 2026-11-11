package edu.unsa.epcc.loans.reservation.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Estado de una reserva: pendiente, convertida en préstamo, cancelada por el usuario o vencida. */
@Getter
@RequiredArgsConstructor
public enum ReservationStatus {
    PENDING("Pendiente"),
    FULFILLED("Cumplida"),
    CANCELLED("Cancelada"),
    EXPIRED("Expirada");

    /** Nombre en español para mensajes al usuario. */
    private final String label;
}
