package edu.unsa.epcc.loans.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Reloj de pruebas que se puede adelantar, para probar atrasos, sanciones que terminan y reservas que expiran. */
public class MutableClock extends Clock {

    private Instant now = WorkingDays.nextMorning(Instant.now());

    public void advance(Duration duration) {
        now = now.plus(duration);
    }

    /** Vuelve a las próximas 08:00 de Lima de un día no domingo: dentro del horario de atención y sin domingos. */
    public void reset() {
        now = WorkingDays.nextMorning(Instant.now());
    }

    /** Igual que {@link #reset()}; se mantiene el nombre para las pruebas de reservas. */
    public void resetOutsideSunday() {
        reset();
    }

    @Override
    public ZoneId getZone() {
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return this;
    }

    @Override
    public Instant instant() {
        return now;
    }
}
