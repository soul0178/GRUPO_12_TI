package edu.unsa.epcc.loans.common.util;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** Da formato de fecha y hora de Lima a un Instant para usarlo en mensajes al usuario. */
public final class LimaTime {

    private static final ZoneId ZONE = ZoneId.of("America/Lima");
    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZONE);

    private LimaTime() {
    }

    /** Devuelve el instante como "dd/MM/yyyy HH:mm" en hora de Lima. */
    public static String format(Instant instant) {
        return FORMAT.format(instant);
    }

    /**
     * Indica si el rango [start, end) toca algún domingo en hora de Lima. Un rango que termina justo a las 00:00
     * de un domingo no lo toca; uno que empieza a las 00:00 de un domingo, sí. Requiere {@code end > start}.
     */
    public static boolean overlapsSunday(Instant start, Instant end) {
        LocalDate day = start.atZone(ZONE).toLocalDate();
        LocalDate lastDay = end.minusNanos(1).atZone(ZONE).toLocalDate();
        for (; !day.isAfter(lastDay); day = day.plusDays(1)) {
            if (day.getDayOfWeek() == DayOfWeek.SUNDAY) {
                return true;
            }
        }
        return false;
    }
}
