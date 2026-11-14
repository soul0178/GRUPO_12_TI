package edu.unsa.epcc.loans.common.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.Test;

/** Regla de domingos (hora de Lima). 10/03/2035 es sábado, 11/03/2035 domingo y 12/03/2035 lunes. */
class LimaTimeTest {

    private static Instant lima(int day, int hour, int minute) {
        return ZonedDateTime.of(2035, 3, day, hour, minute, 0, 0, ZoneId.of("America/Lima")).toInstant();
    }

    @Test
    void shouldDetectRangeInsideSunday() {
        assertThat(LimaTime.overlapsSunday(lima(11, 10, 0), lima(11, 12, 0))).isTrue();
    }

    @Test
    void shouldDetectRangeCrossingIntoOrOutOfSunday() {
        assertThat(LimaTime.overlapsSunday(lima(10, 23, 0), lima(11, 1, 0))).isTrue();
        assertThat(LimaTime.overlapsSunday(lima(11, 23, 0), lima(12, 1, 0))).isTrue();
    }

    @Test
    void shouldAllowWeekdaysAndSaturday() {
        assertThat(LimaTime.overlapsSunday(lima(10, 10, 0), lima(10, 12, 0))).isFalse();
        assertThat(LimaTime.overlapsSunday(lima(12, 10, 0), lima(12, 12, 0))).isFalse();
    }

    @Test
    void shouldTreatSundayBoundariesAsHalfOpenRange() {
        assertThat(LimaTime.overlapsSunday(lima(10, 22, 0), lima(11, 0, 0))).isFalse();
        assertThat(LimaTime.overlapsSunday(lima(11, 0, 0), lima(11, 1, 0))).isTrue();
        assertThat(LimaTime.overlapsSunday(lima(11, 23, 0), lima(12, 0, 0))).isTrue();
    }

    @Test
    void shouldUseLimaTimeNotUtc() {
        // Sábado 20:00 en Lima = domingo 01:00 UTC: no es domingo en Lima
        assertThat(LimaTime.overlapsSunday(lima(10, 20, 0), lima(10, 21, 0))).isFalse();
        // Domingo 20:00 en Lima = lunes 01:00 UTC: sí es domingo en Lima
        assertThat(LimaTime.overlapsSunday(lima(11, 20, 0), lima(11, 21, 0))).isTrue();
    }
}
