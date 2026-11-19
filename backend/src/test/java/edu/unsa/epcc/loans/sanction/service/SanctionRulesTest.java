package edu.unsa.epcc.loans.sanction.service;

import static org.assertj.core.api.Assertions.assertThat;

import edu.unsa.epcc.loans.sanction.entity.DamageLevel;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Política de sanciones: duraciones, reincidencia y topes. */
class SanctionRulesTest {

    @ParameterizedTest
    @CsvSource({"0, 1", "1, 2", "2, 3", "3, 3", "10, 3"})
    void shouldMultiplyByRecidivismUpToThree(long previous, int factor) {
        assertThat(SanctionRules.recidivismFactor(previous)).isEqualTo(factor);
    }

    @Test
    void shouldNeverExceedTheMaximumDuration() {
        assertThat(SanctionRules.daysWithRecidivism(SanctionRules.SEVERE_DAMAGE_DAYS, 1)).isEqualTo(SanctionRules.MAX_DAYS);
        assertThat(SanctionRules.daysWithRecidivism(SanctionRules.LOSS_DAYS, 5)).isEqualTo(SanctionRules.MAX_DAYS);
        assertThat(SanctionRules.daysWithRecidivism(SanctionRules.NO_SHOW_DAYS, 2)).isEqualTo(3);
    }

    @Test
    void shouldIncreaseDamageDurationWithTheLevel() {
        assertThat(SanctionRules.damageDays(DamageLevel.MINOR))
                .isLessThan(SanctionRules.damageDays(DamageLevel.MODERATE));
        assertThat(SanctionRules.damageDays(DamageLevel.MODERATE))
                .isLessThan(SanctionRules.damageDays(DamageLevel.SEVERE));
    }
}
