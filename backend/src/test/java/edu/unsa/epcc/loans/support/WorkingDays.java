package edu.unsa.epcc.loans.support;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Las reservas no se permiten los domingos y los préstamos/reservas solo caben entre las 07:00 y las 20:10 (hora de
 * Lima). Las pruebas parten siempre de las 08:00 de un día no domingo para no depender de cuándo se ejecutan.
 */
public final class WorkingDays {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");

    private WorkingDays() {
    }

    /** Próximas 08:00 de Lima (estrictamente futuras) en un día que no sea domingo. */
    public static Instant nextMorning(Instant from) {
        LocalDate day = from.atZone(LIMA).toLocalDate();
        while (true) {
            Instant candidate = day.atTime(8, 0).atZone(LIMA).toInstant();
            if (candidate.isAfter(from) && day.getDayOfWeek() != DayOfWeek.SUNDAY) {
                return candidate;
            }
            day = day.plusDays(1);
        }
    }
}
