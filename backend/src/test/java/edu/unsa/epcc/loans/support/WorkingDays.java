package edu.unsa.epcc.loans.support;

import edu.unsa.epcc.loans.common.util.LimaTime;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/**
 * Las reservas no se permiten los domingos (hora de Lima). Las pruebas que reservan "dentro de unas horas" usan esto
 * para no fallar cuando se ejecutan en sábado por la noche o en domingo.
 */
public final class WorkingDays {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final Duration WINDOW = Duration.ofHours(12);

    private WorkingDays() {
    }

    /** Devuelve {@code from} si las próximas 12 horas no tocan un domingo; si no, el lunes siguiente a las 10:00. */
    public static Instant safeStart(Instant from) {
        if (!LimaTime.overlapsSunday(from, from.plus(WINDOW))) {
            return from;
        }
        LocalDate monday = from.atZone(LIMA).toLocalDate().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        return monday.atTime(10, 0).atZone(LIMA).toInstant();
    }
}
