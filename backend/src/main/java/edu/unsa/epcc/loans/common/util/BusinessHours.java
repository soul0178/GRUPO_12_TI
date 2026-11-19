package edu.unsa.epcc.loans.common.util;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * Horario de atención (hora de Lima): los préstamos se entregan desde las 07:00 y la devolución debe caer siempre
 * entre las 07:00 y las 20:10 (puede ser otro día: libros 72 h, objetos 24 h). Las reservas siguen la misma regla:
 * empiezan y terminan dentro del horario.
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

    /** Indica si el rango empieza y termina dentro del horario de atención (puede cruzar de un día a otro). */
    public static boolean contains(Instant start, Instant end) {
        return isOpen(start) && isOpen(end);
    }

    /**
     * Ajusta un vencimiento al horario de atención: si cae después del cierre pasa a las 20:10 de ese día; si cae antes
     * de abrir, a las 20:10 del día anterior. Dentro del horario queda igual.
     */
    public static Instant adjustToOpenHours(Instant due) {
        LocalTime time = due.atZone(ZONE).toLocalTime();
        if (time.isAfter(CLOSING)) {
            return closingOf(due);
        }
        if (time.isBefore(OPENING)) {
            return closingOf(due.atZone(ZONE).minusDays(1).toInstant());
        }
        return due;
    }
}
