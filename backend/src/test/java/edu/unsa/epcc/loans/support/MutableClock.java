package edu.unsa.epcc.loans.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Reloj de pruebas que se puede adelantar, para probar atrasos, sanciones que terminan y reservas que expiran. */
public class MutableClock extends Clock {

    private Instant now = Instant.now();

    public void advance(Duration duration) {
        now = now.plus(duration);
    }

    public void reset() {
        now = Instant.now();
    }

    /** Como {@link #reset()}, pero si las próximas horas caen en domingo salta al lunes (no se reserva en domingo). */
    public void resetOutsideSunday() {
        now = WorkingDays.safeStart(Instant.now());
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
