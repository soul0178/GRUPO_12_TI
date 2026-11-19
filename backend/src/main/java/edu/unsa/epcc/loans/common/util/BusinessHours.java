package edu.unsa.epcc.loans.common.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Horario de atención (hora de Lima): los préstamos se entregan desde las 07:00 y todo debe devolverse antes de las
 * 20:10 del mismo día. Las reservas también deben caber dentro de ese horario.
 */
public final class BusinessHours {

    public static final LocalTime OPENING = LocalTime.of(7, 0);
    public static final LocalTime CLOSING = LocalTime.of(20, 10);
    public static final String LABEL = "07:00 a 20:10";

    private static final ZoneId ZONE = ZoneId.of("America/Lima");

    private BusinessHours() {
    }

    /** Indica si el instante cae dentro del horario de atención (ambos extremos incluidos). */
    public static boolean isOpen(Instant instant) {
        LocalTime time = instant.atZone(ZONE).toLocalTime();
        return !time.isBefore(OPENING) && !time.isAfter(CLOSING);
    }

    /** Hora de cierre (20:10 de Lima) del día en que cae el instante. */
    public static Instant closingOf(Instant instant) {
        LocalDate day = instant.atZone(ZONE).toLocalDate();
        return day.atTime(CLOSING).atZone(ZONE).toInstant();
    }

    /** Indica si el rango empieza y termina el mismo día de Lima, dentro del horario de atención. */
    public static boolean contains(Instant start, Instant end) {
        ZonedDateTime from = start.atZone(ZONE);
        ZonedDateTime to = end.atZone(ZONE);
        return from.toLocalDate().equals(to.toLocalDate()) && isOpen(start) && isOpen(end);
    }
}
