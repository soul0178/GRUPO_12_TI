package edu.unsa.epcc.loans.reservation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.inventory.service.ItemService;
import edu.unsa.epcc.loans.reservation.dto.AvailabilityResponse;
import edu.unsa.epcc.loans.reservation.dto.BusyRangeResponse.BusyType;
import edu.unsa.epcc.loans.reservation.dto.CreateReservationRequest;
import edu.unsa.epcc.loans.reservation.dto.ReservationResponse;
import edu.unsa.epcc.loans.reservation.entity.ReservationStatus;
import edu.unsa.epcc.loans.sanction.service.SanctionService;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.MutableClock;
import edu.unsa.epcc.loans.support.MutableClockConfig;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestLoanFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

/** Reglas de reservas (RF-05, RNF-02) contra PostgreSQL real, con reloj ajustable. */
@Import(MutableClockConfig.class)
class ReservationServiceTest extends IntegrationTestBase {

    @Autowired
    private ReservationService reservationService;
    @Autowired
    private ItemService itemService;
    @Autowired
    private SanctionService sanctionService;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;
    @Autowired
    private TestLoanFactory loans;
    @Autowired
    private MutableClock clock;

    private Instant start;

    @BeforeEach
    void setUp() {
        clock.reset();
        start = clock.instant().plus(Duration.ofHours(2));
    }

    private ReservationResponse reserve(User user, Item item, Instant from, Instant to) {
        return reservationService.create(new CreateReservationRequest(item.getId(), from, to), user.getId());
    }

    private ReservationResponse reserve(User user, Item item) {
        return reserve(user, item, start, start.plus(Duration.ofHours(1)));
    }

    @Test
    void shouldCreatePendingReservation() {
        User user = users.create(Role.STUDENT);
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);

        ReservationResponse reservation = reserve(user, item);

        assertThat(reservation.status()).isEqualTo(ReservationStatus.PENDING);
        assertThat(reservation.itemCode()).isEqualTo(item.getCode());
        assertThat(reservation.userId()).isEqualTo(user.getId());
    }

    @Test
    void shouldRejectOverlappingReservationsOfSameItem() {
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);
        reserve(users.create(Role.STUDENT), item);

        assertThatThrownBy(() -> reserve(users.create(Role.TEACHER), item, start.plus(Duration.ofMinutes(30)),
                start.plus(Duration.ofMinutes(90)))).isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya está reservado");
    }

    @Test
    void shouldAllowAdjacentReservationsOfSameItem() {
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);
        reserve(users.create(Role.STUDENT), item);

        ReservationResponse next = reserve(users.create(Role.TEACHER), item, start.plus(Duration.ofHours(1)),
                start.plus(Duration.ofHours(2)));

        assertThat(next.status()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    void shouldLetOnlyOneOfTwoConcurrentReservationsSucceed() throws Exception {
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);
        List<User> borrowers = List.of(users.create(Role.STUDENT), users.create(Role.STUDENT));
        CountDownLatch go = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Boolean>> results = new ArrayList<>();
        for (User borrower : borrowers) {
            Callable<Boolean> attempt = () -> {
                go.await();
                try {
                    reserve(borrower, item);
                    return true;
                } catch (BusinessException exception) {
                    return false;
                }
            };
            results.add(pool.submit(attempt));
        }
        go.countDown();

        long successes = 0;
        for (Future<Boolean> result : results) {
            successes += result.get() ? 1 : 0;
        }
        pool.shutdown();

        assertThat(successes).isEqualTo(1);
    }

    @Test
    void shouldRejectRangeLongerThanCategoryLimit() {
        Item equipment = items.create("Equipo", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> reserve(users.create(Role.STUDENT), equipment, start, start.plus(Duration.ofHours(5))))
                .isInstanceOf(BusinessException.class).hasMessageContaining("4 horas");
        assertThat(reserve(users.create(Role.STUDENT), equipment, start, start.plus(Duration.ofHours(4))).status())
                .isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    void shouldRejectReservationNotInTheFutureOrWithInvertedRange() {
        User user = users.create(Role.STUDENT);
        Item item = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> reserve(user, item, clock.instant().minusSeconds(60), start))
                .isInstanceOf(BusinessException.class).hasMessageContaining("futuro");
        assertThatThrownBy(() -> reserve(user, item, start, start.minusSeconds(60)))
                .isInstanceOf(BusinessException.class).hasMessageContaining("posterior");
    }

    @Test
    void shouldRejectItemOutOfServiceOrRetiredButAllowOnLoan() {
        User user = users.create(Role.STUDENT);
        Item broken = items.create("Libro", ItemStatus.OUT_OF_SERVICE);
        Item retired = items.create("Libro", ItemStatus.RETIRED);
        Item onLoan = items.create("Libro", ItemStatus.ON_LOAN);

        assertThatThrownBy(() -> reserve(user, broken)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> reserve(user, retired)).isInstanceOf(BusinessException.class);
        assertThat(reserve(user, onLoan).status()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    void shouldRejectReservationOverlappingOpenLoanOfTheItem() {
        User borrower = users.create(Role.STUDENT);
        Item item = loans.create(borrower).getItem();

        assertThatThrownBy(() -> reserve(users.create(Role.TEACHER), item, clock.instant().plusSeconds(600),
                clock.instant().plusSeconds(1200))).isInstanceOf(BusinessException.class)
                .hasMessageContaining("prestado hasta");
    }

    @Test
    void shouldRejectInactiveUserAndSanctionedUser() {
        Item item = items.create("Libro", ItemStatus.AVAILABLE);
        User sanctioned = users.create(Role.STUDENT);
        sanctionService.createOverdueSanction(sanctioned.getId(), loans.create(users.create(Role.STUDENT)).getId(),
                Duration.ofHours(1));

        assertThatThrownBy(() -> reserve(users.createInactive(Role.STUDENT), item))
                .isInstanceOf(BusinessException.class).hasMessageContaining("desactivado");
        assertThatThrownBy(() -> reserve(sanctioned, item)).isInstanceOf(BusinessException.class)
                .hasMessageContaining("sanción");
    }

    @Test
    void shouldCountPendingReservationsAndOpenLoansAgainstLimitOfThree() {
        User user = users.create(Role.STUDENT);
        loans.create(user);
        reserve(user, items.create("Libro", ItemStatus.AVAILABLE));
        reserve(user, items.create("Libro", ItemStatus.AVAILABLE));
        Item fourth = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> reserve(user, fourth)).isInstanceOf(BusinessException.class)
                .hasMessageContaining("máximo 3");
    }

    @Test
    void shouldFailWhenItemDoesNotExist() {
        assertThatThrownBy(() -> reservationService.create(
                new CreateReservationRequest(-1L, start, start.plusSeconds(3600)), users.create(Role.STUDENT).getId()))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldExpirePendingReservationAfterConfiguredMinutesFromStart() {
        User user = users.create(Role.STUDENT);
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);
        ReservationResponse reservation = reserve(user, item);

        clock.advance(Duration.ofHours(2).plusMinutes(29));
        assertThat(statusOf(user, reservation)).isEqualTo(ReservationStatus.PENDING);
        clock.advance(Duration.ofMinutes(2));

        assertThat(statusOf(user, reservation)).isEqualTo(ReservationStatus.EXPIRED);
    }

    @Test
    void shouldFreeTheRangeOnceReservationExpires() {
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);
        reserve(users.create(Role.STUDENT), item);
        clock.advance(Duration.ofHours(2).plusMinutes(31));
        Instant newStart = clock.instant().plus(Duration.ofMinutes(10));

        ReservationResponse again = reserve(users.create(Role.TEACHER), item, newStart,
                newStart.plus(Duration.ofHours(1)));

        assertThat(again.status()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    void shouldCancelOwnPendingReservationAndFreeTheRange() {
        User owner = users.create(Role.STUDENT);
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);
        ReservationResponse reservation = reserve(owner, item);

        ReservationResponse cancelled = reservationService.cancel(reservation.id(), owner.getId());

        assertThat(cancelled.status()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(reserve(users.create(Role.TEACHER), item).status()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    void shouldRejectCancellingSomeoneElsesOrNonPendingReservation() {
        User owner = users.create(Role.STUDENT);
        ReservationResponse reservation = reserve(owner, items.create("Libro", ItemStatus.AVAILABLE));

        assertThatThrownBy(() -> reservationService.cancel(reservation.id(), users.create(Role.STUDENT).getId()))
                .isInstanceOf(AccessDeniedException.class);
        reservationService.cancel(reservation.id(), owner.getId());
        assertThatThrownBy(() -> reservationService.cancel(reservation.id(), owner.getId()))
                .isInstanceOf(BusinessException.class).hasMessageContaining("pendientes");
    }

    @Test
    void shouldReportAvailabilityWithBusyRanges() {
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);
        Instant from = start.minus(Duration.ofHours(1));
        Instant to = start.plus(Duration.ofHours(3));
        assertThat(reservationService.availability(item.getId(), from, to).available()).isTrue();
        reserve(users.create(Role.STUDENT), item);

        AvailabilityResponse busy = reservationService.availability(item.getId(), from, to);
        AvailabilityResponse free = reservationService.availability(item.getId(), start.plus(Duration.ofHours(1)),
                start.plus(Duration.ofHours(2)));

        assertThat(busy.available()).isFalse();
        assertThat(busy.busyRanges()).hasSize(1);
        assertThat(busy.busyRanges().get(0).type()).isEqualTo(BusyType.RESERVATION);
        assertThat(free.available()).isTrue();
    }

    @Test
    void shouldReportOpenLoanAsBusyAndOutOfServiceItemAsUnavailable() {
        Item loaned = loans.create(users.create(Role.STUDENT)).getItem();
        Item broken = items.create("Libro", ItemStatus.OUT_OF_SERVICE);
        Instant to = clock.instant().plus(Duration.ofHours(1));

        AvailabilityResponse withLoan = reservationService.availability(loaned.getId(), clock.instant(), to);

        assertThat(withLoan.busyRanges()).extracting(range -> range.type()).containsExactly(BusyType.LOAN);
        assertThat(reservationService.availability(broken.getId(), start, start.plusSeconds(60)).available())
                .isFalse();
        assertThatThrownBy(() -> reservationService.availability(broken.getId(), to, clock.instant()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldNotRetireItemWithPendingReservationButAllowAfterCancelling() {
        User owner = users.create(Role.STUDENT);
        Item item = items.create("Libro", ItemStatus.AVAILABLE);
        ReservationResponse reservation = reserve(owner, item);

        assertThatThrownBy(() -> itemService.retire(item.getId())).isInstanceOf(BusinessException.class)
                .hasMessageContaining("reservas pendientes");
        reservationService.cancel(reservation.id(), owner.getId());

        assertThat(itemService.retire(item.getId()).status()).isEqualTo(ItemStatus.RETIRED);
    }

    @Test
    void shouldFilterReservationsByUserAndStatus() {
        User user = users.create(Role.STUDENT);
        ReservationResponse first = reserve(user, items.create("Libro", ItemStatus.AVAILABLE));
        reserve(user, items.create("Libro", ItemStatus.AVAILABLE));
        reservationService.cancel(first.id(), user.getId());

        var mine = reservationService.search(user.getId(), null, null, PageRequest.of(0, 10));
        var pending = reservationService.search(user.getId(), null, ReservationStatus.PENDING, PageRequest.of(0, 10));

        assertThat(mine.totalElements()).isEqualTo(2);
        assertThat(pending.totalElements()).isEqualTo(1);
    }

    private ReservationStatus statusOf(User user, ReservationResponse reservation) {
        return reservationService.search(user.getId(), null, null, PageRequest.of(0, 10)).content().stream()
                .filter(found -> found.id().equals(reservation.id())).findFirst().orElseThrow().status();
    }
}
