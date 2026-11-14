package edu.unsa.epcc.loans.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.loan.dto.LoanResponse;
import edu.unsa.epcc.loans.loan.entity.LoanStatus;
import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import edu.unsa.epcc.loans.report.dto.LoanHistoryReport;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestLoanFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** Historial de préstamos por usuario y por ítem contra PostgreSQL real. */
class ReportServiceTest extends IntegrationTestBase {

    private static final Pageable PAGE = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "checkedOutAt"));

    @Autowired
    private ReportService reportService;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;
    @Autowired
    private TestLoanFactory loans;

    private Instant now;
    private User user;
    private Instant checkedOutReturnedOnTime;
    private Instant checkedOutReturnedLate;
    private Instant checkedOutOverdue;
    private Instant checkedOutActive;

    private Item newItem() {
        return items.create("Libro", ItemStatus.AVAILABLE);
    }

    /**
     * Usuario con cuatro préstamos: devuelto a tiempo (hace 10 días), devuelto tarde y dañado (hace 5 días),
     * vencido sin devolver (hace 2 días) y activo (hace 1 hora). Otro usuario tiene un préstamo que no debe aparecer.
     */
    @BeforeEach
    void setUp() {
        now = Instant.now();
        user = users.create(Role.STUDENT);
        checkedOutReturnedOnTime = now.minus(Duration.ofDays(10));
        checkedOutReturnedLate = now.minus(Duration.ofDays(5));
        checkedOutOverdue = now.minus(Duration.ofDays(2));
        checkedOutActive = now.minus(Duration.ofHours(1));
        loans.create(user, newItem(), checkedOutReturnedOnTime, checkedOutReturnedOnTime.plus(Duration.ofHours(4)),
                checkedOutReturnedOnTime.plus(Duration.ofHours(3)), PhysicalCondition.GOOD);
        loans.create(user, newItem(), checkedOutReturnedLate, checkedOutReturnedLate.plus(Duration.ofHours(4)),
                checkedOutReturnedLate.plus(Duration.ofHours(10)), PhysicalCondition.DAMAGED);
        loans.create(user, newItem(), checkedOutOverdue, checkedOutOverdue.plus(Duration.ofHours(4)), null, null);
        loans.create(user, newItem(), checkedOutActive, now.plus(Duration.ofHours(3)), null, null);
        loans.create(users.create(Role.TEACHER), newItem(), checkedOutActive, now.plus(Duration.ofHours(3)), null,
                null);
    }

    @Test
    void shouldSummarizeUserHistoryByStatus() {
        LoanHistoryReport report = reportService.userHistory(user.getId(), null, null, null, PAGE);

        assertThat(report.subject().id()).isEqualTo(user.getId());
        assertThat(report.subject().name()).isEqualTo(user.getFirstName() + " " + user.getLastName());
        assertThat(report.summary().total()).isEqualTo(4);
        assertThat(report.summary().active()).isEqualTo(1);
        assertThat(report.summary().overdue()).isEqualTo(1);
        assertThat(report.summary().returned()).isEqualTo(2);
        assertThat(report.summary().returnedLate()).isEqualTo(1);
        assertThat(report.summary().returnedDamaged()).isEqualTo(1);
        assertThat(report.loans().totalElements()).isEqualTo(4);
        assertThat(report.loans().content()).extracting(LoanResponse::userId).containsOnly(user.getId());
    }

    @Test
    void shouldListNewestLoansFirst() {
        LoanHistoryReport report = reportService.userHistory(user.getId(), null, null, null, PAGE);

        assertThat(report.loans().content()).extracting(LoanResponse::status)
                .containsExactly(LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.RETURNED, LoanStatus.RETURNED);
    }

    @Test
    void shouldFilterTableByStatusButKeepSummaryOfWholeRange() {
        LoanHistoryReport overdue = reportService.userHistory(user.getId(), null, null, LoanStatus.OVERDUE, PAGE);
        LoanHistoryReport returned = reportService.userHistory(user.getId(), null, null, LoanStatus.RETURNED, PAGE);
        LoanHistoryReport active = reportService.userHistory(user.getId(), null, null, LoanStatus.ACTIVE, PAGE);

        assertThat(overdue.loans().content()).extracting(LoanResponse::status).containsOnly(LoanStatus.OVERDUE);
        assertThat(overdue.loans().totalElements()).isEqualTo(1);
        assertThat(returned.loans().totalElements()).isEqualTo(2);
        assertThat(active.loans().totalElements()).isEqualTo(1);
        assertThat(overdue.summary().total()).isEqualTo(4);
    }

    @Test
    void shouldFilterByDateRangeInLimaTime() {
        LocalDate day = checkedOutReturnedLate.atZone(ZoneId.of("America/Lima")).toLocalDate();

        LoanHistoryReport report = reportService.userHistory(user.getId(), day, day, null, PAGE);

        assertThat(report.summary().total()).isEqualTo(1);
        assertThat(report.summary().returnedDamaged()).isEqualTo(1);
        assertThat(report.loans().content()).hasSize(1);
        assertThat(report.from()).isEqualTo(day);
        assertThat(report.to()).isEqualTo(day);
    }

    @Test
    void shouldIncludeTheWholeLastDayOfTheRange() {
        LocalDate today = now.atZone(ZoneId.of("America/Lima")).toLocalDate();

        LoanHistoryReport report = reportService.userHistory(user.getId(), today.minusDays(3), today, null, PAGE);

        assertThat(report.summary().total()).isEqualTo(2);
        assertThat(report.summary().active()).isEqualTo(1);
        assertThat(report.summary().overdue()).isEqualTo(1);
    }

    @Test
    void shouldReturnEmptyReportForUserWithoutLoans() {
        LoanHistoryReport report = reportService.userHistory(users.create(Role.STUDENT).getId(), null, null, null,
                PAGE);

        assertThat(report.summary().total()).isZero();
        assertThat(report.summary().returnedLate()).isZero();
        assertThat(report.loans().content()).isEmpty();
    }

    @Test
    void shouldRejectRangeWhereStartIsAfterEnd() {
        LocalDate today = LocalDate.now();

        assertThatThrownBy(() -> reportService.userHistory(user.getId(), today, today.minusDays(1), null, PAGE))
                .isInstanceOf(BusinessException.class).hasMessageContaining("fecha inicial");
    }

    @Test
    void shouldFailWhenUserOrItemDoesNotExist() {
        assertThatThrownBy(() -> reportService.userHistory(-1L, null, null, null, PAGE))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> reportService.itemHistory(-1L, null, null, null, PAGE))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldSummarizeItemHistoryAcrossUsers() {
        Item item = newItem();
        User first = users.create(Role.STUDENT);
        User second = users.create(Role.TEACHER);
        Instant start = now.minus(Duration.ofDays(8));
        loans.create(first, item, start, start.plus(Duration.ofHours(4)), start.plus(Duration.ofHours(2)),
                PhysicalCondition.GOOD);
        loans.create(second, item, start.plus(Duration.ofDays(1)), start.plus(Duration.ofDays(1)).plus(
                Duration.ofHours(4)), start.plus(Duration.ofDays(1)).plus(Duration.ofHours(6)),
                PhysicalCondition.DAMAGED);
        loans.create(first, item, checkedOutOverdue, checkedOutOverdue.plus(Duration.ofHours(4)), null, null);

        LoanHistoryReport report = reportService.itemHistory(item.getId(), null, null, null, PAGE);

        assertThat(report.subject().id()).isEqualTo(item.getId());
        assertThat(report.subject().name()).startsWith(item.getCode());
        assertThat(report.summary().total()).isEqualTo(3);
        assertThat(report.summary().returned()).isEqualTo(2);
        assertThat(report.summary().overdue()).isEqualTo(1);
        assertThat(report.summary().returnedLate()).isEqualTo(1);
        assertThat(report.summary().returnedDamaged()).isEqualTo(1);
        assertThat(report.loans().content()).extracting(LoanResponse::itemId).containsOnly(item.getId());
        assertThat(report.loans().content()).extracting(LoanResponse::userId)
                .containsExactlyInAnyOrder(first.getId(), second.getId(), first.getId());
    }
}
