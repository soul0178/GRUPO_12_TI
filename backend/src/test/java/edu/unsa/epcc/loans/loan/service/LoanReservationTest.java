package edu.unsa.epcc.loans.loan.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.loan.dto.CreateLoanRequest;
import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import edu.unsa.epcc.loans.reservation.dto.CreateReservationRequest;
import edu.unsa.epcc.loans.reservation.dto.ReservationResponse;
import edu.unsa.epcc.loans.reservation.entity.ReservationStatus;
import edu.unsa.epcc.loans.reservation.service.ReservationService;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.MutableClock;
import edu.unsa.epcc.loans.support.MutableClockConfig;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;

/** Cómo la entrega (RF-04) interactúa con las reservas: bloqueo por reserva ajena y cumplimiento de la propia. */
@Import(MutableClockConfig.class)
class LoanReservationTest extends IntegrationTestBase {

    @Autowired
    private LoanService loanService;
    @Autowired
    private ReservationService reservationService;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;
    @Autowired
    private MutableClock clock;

    private User manager;

    @BeforeEach
    void setUp() {
        clock.reset();
        manager = users.create(Role.MANAGER);
    }

    private ReservationResponse reserveSoon(User user, Item item) {
        Instant from = clock.instant().plus(Duration.ofHours(1));
        return reservationService.create(new CreateReservationRequest(item.getId(), from,
                from.plus(Duration.ofHours(1))), user.getId());
    }

    private void deliver(User user, Item item) {
        loanService.create(new CreateLoanRequest(user.getId(), item.getId(), PhysicalCondition.GOOD, null, null),
                manager.getId());
    }

    private ReservationStatus statusOf(User user, ReservationResponse reservation) {
        return reservationService.search(user.getId(), null, null, PageRequest.of(0, 10)).content().stream()
                .filter(found -> found.id().equals(reservation.id())).findFirst().orElseThrow().status();
    }

    @Test
    void shouldRejectDeliveryWhenAnotherUserHasOverlappingReservation() {
        Item book = items.create("Libro", ItemStatus.AVAILABLE);
        reserveSoon(users.create(Role.TEACHER), book);

        assertThatThrownBy(() -> deliver(users.create(Role.STUDENT), book)).isInstanceOf(BusinessException.class)
                .hasMessageContaining("reserva de otro usuario");
        assertThat(items.create("Libro", ItemStatus.AVAILABLE)).isNotNull();
    }

    @Test
    void shouldFulfillOwnPendingReservationOnDelivery() {
        User user = users.create(Role.STUDENT);
        Item book = items.create("Libro", ItemStatus.AVAILABLE);
        ReservationResponse reservation = reserveSoon(user, book);

        deliver(user, book);

        assertThat(statusOf(user, reservation)).isEqualTo(ReservationStatus.FULFILLED);
    }

    @Test
    void shouldIgnoreReservationsThatDoNotOverlapTheLoanPeriod() {
        Item equipment = items.create("Equipo", ItemStatus.AVAILABLE);
        Instant later = clock.instant().plus(Duration.ofHours(10));
        reservationService.create(new CreateReservationRequest(equipment.getId(), later,
                later.plus(Duration.ofHours(1))), users.create(Role.TEACHER).getId());
        User user = users.create(Role.STUDENT);

        loanService.create(new CreateLoanRequest(user.getId(), equipment.getId(), PhysicalCondition.GOOD, null,
                new edu.unsa.epcc.loans.loan.dto.GuaranteeRequest(
                        edu.unsa.epcc.loans.loan.entity.GuaranteeType.DNI, "DNI 1")), manager.getId());

        assertThat(reservationService.search(null, equipment.getId(), ReservationStatus.PENDING,
                PageRequest.of(0, 10)).totalElements()).isEqualTo(1);
    }

    @Test
    void shouldAllowDeliveryAfterOtherUsersReservationExpires() {
        Item book = items.create("Libro", ItemStatus.AVAILABLE);
        reserveSoon(users.create(Role.TEACHER), book);
        clock.advance(Duration.ofHours(1).plusMinutes(31));
        User user = users.create(Role.STUDENT);

        deliver(user, book);

        assertThat(loanService.search(user.getId(), null, null, PageRequest.of(0, 10)).totalElements()).isEqualTo(1);
    }
}
