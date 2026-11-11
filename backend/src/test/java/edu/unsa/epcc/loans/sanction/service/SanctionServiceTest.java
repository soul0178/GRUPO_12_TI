package edu.unsa.epcc.loans.sanction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import edu.unsa.epcc.loans.sanction.entity.SanctionType;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.MutableClock;
import edu.unsa.epcc.loans.support.MutableClockConfig;
import edu.unsa.epcc.loans.support.TestLoanFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
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

        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), "Pantalla rota");

        assertThat(suggested.status()).isEqualTo(SanctionStatus.SUGGESTED);
        assertThat(suggested.startAt()).isNull();
        assertThat(sanctionService.hasActiveSanction(user.getId())).isFalse();
    }

    @Test
    void shouldActivateSuggestedSanctionWhenAdminConfirmsItWithDays() {
        User user = student();
        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), "Pantalla rota");

        SanctionResponse confirmed = sanctionService.confirm(suggested.id(), 5);

        assertThat(confirmed.status()).isEqualTo(SanctionStatus.ACTIVE);
        assertThat(ChronoUnit.DAYS.between(confirmed.startAt(), confirmed.endAt())).isEqualTo(5);
        assertThat(sanctionService.hasActiveSanction(user.getId())).isTrue();
    }

    @Test
    void shouldRejectSuggestedSanctionWithoutBlockingTheUser() {
        User user = student();
        SanctionResponse suggested = sanctionService.suggestDamageSanction(user.getId(), loanId(), "Rayón");

        SanctionResponse rejected = sanctionService.reject(suggested.id());

        assertThat(rejected.status()).isEqualTo(SanctionStatus.REJECTED);
        assertThat(sanctionService.hasActiveSanction(user.getId())).isFalse();
    }

    @Test
    void shouldRejectConfirmingOrRejectingASanctionThatIsNotSuggested() {
        User user = student();
        SanctionResponse active = sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));

        assertThatThrownBy(() -> sanctionService.confirm(active.id(), 3)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> sanctionService.reject(active.id())).isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldFailWhenSanctionOrUserDoesNotExist() {
        assertThatThrownBy(() -> sanctionService.confirm(-1L, 3)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> sanctionService.createOverdueSanction(-1L, loanId(), Duration.ofHours(1)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldListOnlyTheSanctionsOfTheGivenUserAndFilterByStatus() {
        User user = student();
        User other = student();
        sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(1));
        sanctionService.suggestDamageSanction(user.getId(), loanId(), "Daño");
        sanctionService.createOverdueSanction(other.getId(), loanId(), Duration.ofHours(1));

        PageResponse<SanctionResponse> all = sanctionService.findByUser(user.getId(), null, PageRequest.of(0, 10));
        PageResponse<SanctionResponse> suggested = sanctionService.findByUser(user.getId(),
                SanctionStatus.SUGGESTED, PageRequest.of(0, 10));

        assertThat(all.content()).hasSize(2).allMatch(sanction -> sanction.userId().equals(user.getId()));
        assertThat(suggested.content()).singleElement()
                .extracting(SanctionResponse::type).isEqualTo(SanctionType.DAMAGE);
    }
}
