package edu.unsa.epcc.loans.sanction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.entity.DamageLevel;
import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import edu.unsa.epcc.loans.sanction.entity.SanctionType;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.MutableClock;
import edu.unsa.epcc.loans.support.MutableClockConfig;
import edu.unsa.epcc.loans.support.TestLoanFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import edu.unsa.epcc.loans.user.service.UserService;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;

/** Reglas de sanciones (RF-08) contra PostgreSQL real, con un reloj que se puede adelantar. */
@Import(MutableClockConfig.class)
class SanctionServiceTest extends IntegrationTestBase {


    @Autowired
    private SanctionService sanctionService;
    @Autowired
    private UserService userService;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestLoanFactory loans;
    @Autowired
    private MutableClock clock;

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    private User student() {
        return users.create(Role.STUDENT);
    }

    /** Id de un préstamo real, porque sanctions.loan_id tiene clave foránea. */
    private long loanId() {
        return loans.create(users.create(Role.STUDENT)).getId();
    }

    @Test
    void shouldReportNoActiveSanctionForUserWithoutSanctions() {
        assertThat(sanctionService.hasActiveSanction(student().getId())).isFalse();
    }

    @ParameterizedTest
    @CsvSource({"1, 1", "60, 1", "1440, 1", "1441, 2", "1500, 2", "2880, 2", "2881, 3"})
    void shouldSanctionForCeilOfOverdueDaysWithMinimumOne(long overdueMinutes, long expectedDays) {
        User user = student();

        SanctionResponse sanction = sanctionService.createOverdueSanction(user.getId(), loanId(),
                Duration.ofMinutes(overdueMinutes));

        assertThat(sanction.type()).isEqualTo(SanctionType.OVERDUE);
        assertThat(sanction.status()).isEqualTo(SanctionStatus.ACTIVE);
        assertThat(ChronoUnit.DAYS.between(sanction.startAt(), sanction.endAt())).isEqualTo(expectedDays);
    }

    @Test
    void shouldBeSanctionedBeforeEndDateAndFreeAfterIt() {
        User user = student();
        sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(2));

        assertThat(sanctionService.hasActiveSanction(user.getId())).isTrue();

        clock.advance(Duration.ofHours(23));
        assertThat(sanctionService.hasActiveSanction(user.getId())).isTrue();

        clock.advance(Duration.ofHours(2));
        assertThat(sanctionService.hasActiveSanction(user.getId())).isFalse();
    }

    @Test
    void shouldMarkExpiredSanctionAsFinished() {
        User user = student();
        sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(2));
        clock.advance(Duration.ofDays(2));

        PageResponse<SanctionResponse> mine = sanctionService.findByUser(user.getId(), null, PageRequest.of(0, 10));

        assertThat(mine.content()).singleElement()
                .extracting(SanctionResponse::status).isEqualTo(SanctionStatus.FINISHED);
    }

    @Test
    void shouldNotBlockUserWhileDamageSanctionIsOnlySuggested() {
        User user = student();

        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), DamageLevel.MODERATE, "Pantalla rota");

        assertThat(suggested.status()).isEqualTo(SanctionStatus.SUGGESTED);
        assertThat(suggested.startAt()).isNull();
        assertThat(sanctionService.hasActiveSanction(user.getId())).isFalse();
    }

    @Test
    void shouldActivateSuggestedSanctionWhenAdminConfirmsItWithDays() {
        User user = student();
        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), DamageLevel.MODERATE, "Pantalla rota");

        SanctionResponse confirmed = sanctionService.confirm(suggested.id(), 5, null);

        assertThat(confirmed.status()).isEqualTo(SanctionStatus.ACTIVE);
        assertThat(ChronoUnit.DAYS.between(confirmed.startAt(), confirmed.endAt())).isEqualTo(5);
        assertThat(sanctionService.hasActiveSanction(user.getId())).isTrue();
    }

    @Test
    void shouldRejectSuggestedSanctionWithoutBlockingTheUser() {
        User user = student();
        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), DamageLevel.MODERATE, "Rayón");

        SanctionResponse rejected = sanctionService.reject(suggested.id());

        assertThat(rejected.status()).isEqualTo(SanctionStatus.REJECTED);
        assertThat(sanctionService.hasActiveSanction(user.getId())).isFalse();
    }

    @Test
    void shouldRejectConfirmingOrRejectingASanctionThatIsNotSuggested() {
        User user = student();
        SanctionResponse active = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));

        assertThatThrownBy(() -> sanctionService.confirm(active.id(), 3, null)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> sanctionService.reject(active.id())).isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldFailWhenSanctionOrUserDoesNotExist() {
        assertThatThrownBy(() -> sanctionService.confirm(-1L, 3, null)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> sanctionService.createOverdueSanction(-1L, loanId(), Duration.ofHours(1)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldListOnlyTheSanctionsOfTheGivenUserAndFilterByStatus() {
        User user = student();
        User other = student();
        sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));
        sanctionService.suggestDamageSanction(user.getId(), loanId(), DamageLevel.MODERATE, "Daño");
        sanctionService.createOverdueSanction(other.getId(), loanId(), Duration.ofHours(1));

        PageResponse<SanctionResponse> all = sanctionService.findByUser(user.getId(), null, PageRequest.of(0, 10));
        PageResponse<SanctionResponse> suggested = sanctionService.findByUser(user.getId(),
                SanctionStatus.SUGGESTED, PageRequest.of(0, 10));

        assertThat(all.content()).hasSize(2).allMatch(sanction -> sanction.userId().equals(user.getId()));
        assertThat(suggested.content()).singleElement()
                .extracting(SanctionResponse::type).isEqualTo(SanctionType.DAMAGE);
    }

    // ---- Pérdida, niveles de daño, reincidencia, baneo, levantar y reducir ----

    private SanctionResponse confirmedDamage(User user, DamageLevel level) {
        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), level, "Daño");
        return sanctionService.confirm(suggested.id(), null, null);
    }

    private long days(SanctionResponse sanction) {
        return ChronoUnit.DAYS.between(sanction.startAt(), sanction.endAt());
    }

    @Test
    void shouldSanctionLossWithTheMaximumDurationAndBlockTheUser() {
        User user = student();

        SanctionResponse loss = sanctionService.createLossSanction(user.getId(), loanId(), "Se perdió el equipo");

        assertThat(loss.type()).isEqualTo(SanctionType.LOSS);
        assertThat(loss.status()).isEqualTo(SanctionStatus.ACTIVE);
        assertThat(days(loss)).isEqualTo(SanctionRules.LOSS_DAYS);
        assertThat(sanctionService.hasActiveSanction(user.getId())).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"MINOR, 3", "MODERATE, 15", "SEVERE, 60"})
    void shouldApplyADifferentDurationPerDamageLevelWhenAdminConfirmsWithoutDays(DamageLevel level, long expected) {
        SanctionResponse confirmed = confirmedDamage(student(), level);

        assertThat(confirmed.damageLevel()).isEqualTo(level);
        assertThat(days(confirmed)).isEqualTo(expected);
    }

    @Test
    void shouldLetAdminChangeTheDamageLevelWhenConfirming() {
        User user = student();
        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), DamageLevel.MINOR,
                "Rayón");

        SanctionResponse confirmed = sanctionService.confirm(suggested.id(), null, DamageLevel.MODERATE);

        assertThat(confirmed.damageLevel()).isEqualTo(DamageLevel.MODERATE);
        assertThat(days(confirmed)).isEqualTo(SanctionRules.MODERATE_DAMAGE_DAYS);
    }

    @Test
    void shouldKeepNoShowAsTheShortestAndLossAsTheLongestSanction() {
        assertThat(SanctionRules.NO_SHOW_DAYS).isLessThanOrEqualTo(SanctionRules.MINOR_DAMAGE_DAYS);
        assertThat(SanctionRules.LOSS_DAYS).isGreaterThanOrEqualTo(SanctionRules.SEVERE_DAMAGE_DAYS)
                .isEqualTo(SanctionRules.MAX_DAYS);
    }

    @Test
    void shouldEscalateDurationWithRecidivism() {
        User user = student();

        SanctionResponse first = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));
        SanctionResponse second = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));
        SanctionResponse third = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));

        assertThat(days(first)).isEqualTo(1);
        assertThat(days(second)).isEqualTo(2);
        assertThat(days(third)).isEqualTo(3);
    }

    @Test
    void shouldIgnoreSanctionsOlderThanTheRecidivismWindow() {
        User user = student();
        sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));
        clock.advance(Duration.ofDays(SanctionRules.RECIDIVISM_WINDOW_DAYS + 1));

        SanctionResponse later = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));

        assertThat(days(later)).isEqualTo(1);
    }

    @Test
    void shouldNotBanAfterTwoGraveFaults() {
        User user = student();

        sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 1");
        SanctionResponse second = sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 2");

        assertThat(second.causedBan()).isFalse();
        assertThat(userService.findById(user.getId()).active()).isTrue();
    }

    @Test
    void shouldBanTheUserOnTheThirdGraveFaultCountingLossAndSevereDamage() {
        User user = student();
        sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 1");
        confirmedDamage(user, DamageLevel.SEVERE);

        SanctionResponse third = sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 2");

        assertThat(third.causedBan()).isTrue();
        assertThat(days(third)).isEqualTo(SanctionRules.BAN_DAYS);
        assertThat(userService.findById(user.getId()).active()).isFalse();
    }

    @Test
    void shouldNotCountModerateDamageOrLiftedSanctionsAsGraveFaults() {
        User user = student();
        confirmedDamage(user, DamageLevel.MODERATE);
        SanctionResponse lost = sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 1");
        sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 2");
        sanctionService.lift(lost.id(), "Se encontró el ítem");

        SanctionResponse another = sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 3");

        assertThat(another.causedBan()).isFalse();
        assertThat(userService.findById(user.getId()).active()).isTrue();
    }

    @Test
    void shouldLiftAnActiveSanctionAndFreeTheUser() {
        User user = student();
        SanctionResponse active = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofDays(5));

        SanctionResponse lifted = sanctionService.lift(active.id(), "Error de registro");

        assertThat(lifted.status()).isEqualTo(SanctionStatus.LIFTED);
        assertThat(lifted.adminNote()).isEqualTo("Error de registro");
        assertThat(sanctionService.hasActiveSanction(user.getId())).isFalse();
    }

    @Test
    void shouldReactivateTheUserWhenTheBanSanctionIsLifted() {
        User user = student();
        sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 1");
        sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 2");
        SanctionResponse ban = sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida 3");
        assertThat(userService.findById(user.getId()).active()).isFalse();

        sanctionService.lift(ban.id(), "Apelación aceptada");

        assertThat(userService.findById(user.getId()).active()).isTrue();
    }

    @Test
    void shouldOnlyLiftActiveSanctions() {
        User user = student();
        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), DamageLevel.MINOR,
                "Rayón");

        assertThatThrownBy(() -> sanctionService.lift(suggested.id(), "Motivo")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> sanctionService.lift(-1L, "Motivo")).isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldReduceAnActiveSanctionToAShorterDuration() {
        User user = student();
        SanctionResponse active = sanctionService.createLossSanction(user.getId(), loanId(), "Pérdida");

        SanctionResponse reduced = sanctionService.reduce(active.id(), 30, "Primera falta, colaboró");

        assertThat(days(reduced)).isEqualTo(30);
        assertThat(reduced.status()).isEqualTo(SanctionStatus.ACTIVE);
        assertThat(reduced.adminNote()).isEqualTo("Primera falta, colaboró");
    }

    @Test
    void shouldRejectReducingToALongerOrAlreadyElapsedDurationOrABan() {
        User user = student();
        SanctionResponse active = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofDays(3));
        clock.advance(Duration.ofDays(2).plusHours(1));

        assertThatThrownBy(() -> sanctionService.reduce(active.id(), 3, "Igual")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> sanctionService.reduce(active.id(), 2, "Ya pasó")).isInstanceOf(BusinessException.class);

        User banned = student();
        sanctionService.createLossSanction(banned.getId(), loanId(), "1");
        sanctionService.createLossSanction(banned.getId(), loanId(), "2");
        SanctionResponse ban = sanctionService.createLossSanction(banned.getId(), loanId(), "3");
        assertThatThrownBy(() -> sanctionService.reduce(ban.id(), 10, "Reducir")).isInstanceOf(BusinessException.class);
    }
}
