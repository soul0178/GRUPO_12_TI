package edu.unsa.epcc.loans.common.util;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** Da formato de fecha y hora de Lima a un Instant para usarlo en mensajes al usuario. */
public final class LimaTime {

    private static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("America/Lima"));

    private LimaTime() {
    }

    /** Devuelve el instante como "dd/MM/yyyy HH:mm" en hora de Lima. */
    public static String format(Instant instant) {
        return FORMAT.format(instant);
    }
}
