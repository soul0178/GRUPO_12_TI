package edu.unsa.epcc.loans.common.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.Test;

/** Horario de atención 07:00–20:10 (hora de Lima). */
class BusinessHoursTest {

    private static Instant lima(int day, int hour, int minute) {
        return ZonedDateTime.of(2035, 3, day, hour, minute, 0, 0, ZoneId.of("America/Lima")).toInstant();
    }

    @Test
    void shouldBeOpenFromSevenToTenPastEight() {
        assertThat(BusinessHours.isOpen(lima(12, 7, 0))).isTrue();
        assertThat(BusinessHours.isOpen(lima(12, 13, 30))).isTrue();
        assertThat(BusinessHours.isOpen(lima(12, 20, 10))).isTrue();
    }

    @Test
    void shouldBeClosedOutsideTheSchedule() {
        assertThat(BusinessHours.isOpen(lima(12, 6, 59))).isFalse();
        assertThat(BusinessHours.isOpen(lima(12, 20, 11))).isFalse();
        assertThat(BusinessHours.isOpen(lima(12, 0, 0))).isFalse();
    }

    @Test
    void shouldComputeClosingOfTheSameLimaDay() {
        assertThat(BusinessHours.closingOf(lima(12, 9, 0))).isEqualTo(lima(12, 20, 10));
        // 22:00 en Lima ya es el día siguiente en UTC; el cierre sigue siendo el del día de Lima
        assertThat(BusinessHours.closingOf(lima(12, 22, 0))).isEqualTo(lima(12, 20, 10));
    }

    @Test
    void shouldAcceptRangesWhoseStartAndEndAreBothInsideTheSchedule() {
        assertThat(BusinessHours.contains(lima(12, 7, 0), lima(12, 20, 10))).isTrue();
        // Puede cruzar de un día a otro (libros 72 h, objetos 24 h) si ambos extremos están en horario
        assertThat(BusinessHours.contains(lima(12, 10, 0), lima(13, 10, 0))).isTrue();
        assertThat(BusinessHours.contains(lima(12, 10, 0), lima(15, 10, 0))).isTrue();
    }

    @Test
    void shouldRejectRangesWithAnEndOutsideTheSchedule() {
        assertThat(BusinessHours.contains(lima(12, 6, 0), lima(12, 9, 0))).isFalse();
        assertThat(BusinessHours.contains(lima(12, 19, 0), lima(12, 20, 11))).isFalse();
        assertThat(BusinessHours.contains(lima(12, 10, 0), lima(13, 21, 0))).isFalse();
    }

    @Test
    void shouldAdjustDueDatesToTheSchedule() {
        assertThat(BusinessHours.adjustToOpenHours(lima(13, 10, 0))).isEqualTo(lima(13, 10, 0));
        assertThat(BusinessHours.adjustToOpenHours(lima(12, 23, 0))).isEqualTo(lima(12, 20, 10));
        assertThat(BusinessHours.adjustToOpenHours(lima(13, 5, 0))).isEqualTo(lima(12, 20, 10));
    }
}
