package edu.unsa.epcc.loans.loan.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.inventory.repository.ItemRepository;
import edu.unsa.epcc.loans.loan.dto.CreateLoanRequest;
import edu.unsa.epcc.loans.loan.dto.GuaranteeRequest;
import edu.unsa.epcc.loans.loan.dto.LoanResponse;
import edu.unsa.epcc.loans.loan.dto.ReturnLoanRequest;
import edu.unsa.epcc.loans.loan.entity.GuaranteeType;
import edu.unsa.epcc.loans.loan.entity.LoanStatus;
import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import edu.unsa.epcc.loans.sanction.entity.SanctionType;
import edu.unsa.epcc.loans.sanction.service.SanctionService;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.MutableClock;
import edu.unsa.epcc.loans.support.MutableClockConfig;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;

/** Reglas de entrega y devolución (RF-04, RF-07) contra PostgreSQL real, con reloj ajustable. */
@Import(MutableClockConfig.class)
class LoanServiceTest extends IntegrationTestBase {

    private static final GuaranteeRequest DNI = new GuaranteeRequest(GuaranteeType.DNI, "DNI 12345678");

    @Autowired
    private LoanService loanService;
    @Autowired
    private SanctionService sanctionService;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;
    @Autowired
    private ItemRepository itemRepository;
    @Autowired
    private MutableClock clock;

    private User manager;

    @BeforeEach
    void setUp() {
        clock.reset();
        manager = users.create(Role.MANAGER);
    }

    private CreateLoanRequest request(User user, Item item, GuaranteeRequest guarantee) {
        return new CreateLoanRequest(user.getId(), item.getId(), PhysicalCondition.GOOD, null, guarantee);
    }

    private LoanResponse deliver(User user, Item item) {
        return loanService.create(request(user, item, null), manager.getId());
    }

    private ItemStatus statusOf(Item item) {
        return itemRepository.findById(item.getId()).orElseThrow().getStatus();
    }

    @Test
    void shouldDeliverItemWithDueDateFromCategoryAndMarkItOnLoan() {
        User user = users.create(Role.STUDENT);
        Item book = items.create("Libro", ItemStatus.AVAILABLE);

        LoanResponse loan = deliver(user, book);

        assertThat(loan.status()).isEqualTo(LoanStatus.ACTIVE);
        assertThat(Duration.between(loan.checkedOutAt(), loan.dueAt())).isEqualTo(Duration.ofHours(72));
        assertThat(loan.deliveredByName()).isNotBlank();
        assertThat(statusOf(book)).isEqualTo(ItemStatus.ON_LOAN);
    }

    @Test
    void shouldRequireGuaranteeWhenCategoryDemandsIt() {
        User user = users.create(Role.TEACHER);
        Item equipment = items.create("Equipo", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> deliver(user, equipment)).isInstanceOf(BusinessException.class)
                .hasMessageContaining("garantía");
        assertThat(statusOf(equipment)).isEqualTo(ItemStatus.AVAILABLE);
    }

    @Test
    void shouldStoreGuaranteeWhenDeliveringEquipment() {
        User user = users.create(Role.STUDENT);
        Item equipment = items.create("Equipo", ItemStatus.AVAILABLE);

        LoanResponse loan = loanService.create(request(user, equipment, DNI), manager.getId());

        assertThat(loan.guarantee().type()).isEqualTo(GuaranteeType.DNI);
        assertThat(loan.guarantee().returned()).isFalse();
        assertThat(Duration.between(loan.checkedOutAt(), loan.dueAt())).isEqualTo(Duration.ofHours(4));
    }

    @Test
    void shouldRejectDeliveryToInactiveUser() {
        User inactive = users.createInactive(Role.STUDENT);
        Item book = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> deliver(inactive, book)).isInstanceOf(BusinessException.class)
                .hasMessageContaining("desactivado");
    }

    @Test
    void shouldRejectDeliveryToUserWithActiveSanction() {
        User user = users.create(Role.STUDENT);
        sanctionService.createOverdueSanction(user.getId(), deliverAndGetId(), Duration.ofHours(2));
        Item book = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> deliver(user, book)).isInstanceOf(BusinessException.class)
                .hasMessageContaining("sanción");
    }

    private Long deliverAndGetId() {
        User other = users.create(Role.STUDENT);
        return deliver(other, items.create("Libro", ItemStatus.AVAILABLE)).id();
    }

    @Test
    void shouldRejectFourthOpenLoan() {
        User user = users.create(Role.STUDENT);
        for (int i = 0; i < 3; i++) {
            deliver(user, items.create("Libro", ItemStatus.AVAILABLE));
        }
        Item fourth = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> deliver(user, fourth)).isInstanceOf(BusinessException.class)
                .hasMessageContaining("máximo 3");
    }

    @Test
    void shouldAllowNewLoanAfterReturningOne() {
        User user = users.create(Role.STUDENT);
        LoanResponse first = deliver(user, items.create("Libro", ItemStatus.AVAILABLE));
        deliver(user, items.create("Libro", ItemStatus.AVAILABLE));
        deliver(user, items.create("Libro", ItemStatus.AVAILABLE));
        loanService.returnLoan(first.id(), new ReturnLoanRequest(PhysicalCondition.GOOD, null), manager.getId());

        LoanResponse fourth = deliver(user, items.create("Libro", ItemStatus.AVAILABLE));

        assertThat(fourth.status()).isEqualTo(LoanStatus.ACTIVE);
    }

    @Test
    void shouldRejectItemThatIsNotAvailable() {
        User user = users.create(Role.STUDENT);
        Item onLoan = items.create("Libro", ItemStatus.ON_LOAN);
        Item broken = items.create("Libro", ItemStatus.OUT_OF_SERVICE);
        Item retired = items.create("Libro", ItemStatus.RETIRED);

        for (Item item : new Item[] {onLoan, broken, retired}) {
            assertThatThrownBy(() -> deliver(user, item)).isInstanceOf(BusinessException.class)
                    .hasMessageContaining("no está disponible");
        }
    }

    @Test
    void shouldFailWhenUserOrItemDoesNotExist() {
        User user = users.create(Role.STUDENT);
        Item book = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> loanService.create(
                new CreateLoanRequest(-1L, book.getId(), PhysicalCondition.GOOD, null, null), manager.getId()))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> loanService.create(
                new CreateLoanRequest(user.getId(), -1L, PhysicalCondition.GOOD, null, null), manager.getId()))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldReturnItemToInventoryAndMarkGuaranteeReturned() {
        User user = users.create(Role.STUDENT);
        Item equipment = items.create("Equipo", ItemStatus.AVAILABLE);
        LoanResponse loan = loanService.create(request(user, equipment, DNI), manager.getId());

        LoanResponse returned = loanService.returnLoan(loan.id(),
                new ReturnLoanRequest(PhysicalCondition.GOOD, "Todo en orden"), manager.getId());

        assertThat(returned.status()).isEqualTo(LoanStatus.RETURNED);
        assertThat(returned.returnedAt()).isNotNull();
        assertThat(returned.guarantee().returned()).isTrue();
        assertThat(statusOf(equipment)).isEqualTo(ItemStatus.AVAILABLE);
        assertThat(sanctionsOf(user)).isEmpty();
    }

    @Test
    void shouldRejectReturningTwice() {
        LoanResponse loan = deliver(users.create(Role.STUDENT), items.create("Libro", ItemStatus.AVAILABLE));
        loanService.returnLoan(loan.id(), new ReturnLoanRequest(PhysicalCondition.GOOD, null), manager.getId());

        assertThatThrownBy(() -> loanService.returnLoan(loan.id(),
                new ReturnLoanRequest(PhysicalCondition.GOOD, null), manager.getId()))
                .isInstanceOf(BusinessException.class).hasMessageContaining("ya fue devuelto");
    }

    @Test
    void shouldCreateOverdueSanctionWhenReturnedLate() {
        User user = users.create(Role.STUDENT);
        LoanResponse loan = loanService.create(request(user, items.create("Equipo", ItemStatus.AVAILABLE), DNI),
                manager.getId());
        clock.advance(Duration.ofHours(4).plusMinutes(30));
        assertThat(loanService.findById(loan.id()).status()).isEqualTo(LoanStatus.OVERDUE);

        loanService.returnLoan(loan.id(), new ReturnLoanRequest(PhysicalCondition.GOOD, null), manager.getId());

        SanctionResponse sanction = sanctionsOf(user).get(0);
        assertThat(sanction.type()).isEqualTo(SanctionType.OVERDUE);
        assertThat(sanction.status()).isEqualTo(SanctionStatus.ACTIVE);
        assertThat(sanctionService.hasActiveSanction(user.getId())).isTrue();
    }

    @Test
    void shouldSuggestDamageSanctionAndTakeItemOutOfServiceWhenReturnedDamaged() {
        User user = users.create(Role.STUDENT);
        Item equipment = items.create("Equipo", ItemStatus.AVAILABLE);
        LoanResponse loan = loanService.create(request(user, equipment, DNI), manager.getId());

        loanService.returnLoan(loan.id(), new ReturnLoanRequest(PhysicalCondition.DAMAGED, "Pantalla rota"),
                manager.getId());

        SanctionResponse sanction = sanctionsOf(user).get(0);
        assertThat(sanction.type()).isEqualTo(SanctionType.DAMAGE);
        assertThat(sanction.status()).isEqualTo(SanctionStatus.SUGGESTED);
        assertThat(statusOf(equipment)).isEqualTo(ItemStatus.OUT_OF_SERVICE);
        assertThat(sanctionService.hasActiveSanction(user.getId())).isFalse();
    }

    @Test
    void shouldSuggestDamageWhenConditionWorsensButNotDamaged() {
        User user = users.create(Role.STUDENT);
        LoanResponse loan = deliver(user, items.create("Libro", ItemStatus.AVAILABLE));

        loanService.returnLoan(loan.id(), new ReturnLoanRequest(PhysicalCondition.FAIR, null), manager.getId());

        assertThat(sanctionsOf(user)).hasSize(1);
    }

    @Test
    void shouldNotSuggestDamageWhenConditionDoesNotWorsen() {
        User user = users.create(Role.STUDENT);
        LoanResponse loan = loanService.create(new CreateLoanRequest(user.getId(),
                items.create("Libro", ItemStatus.AVAILABLE).getId(), PhysicalCondition.FAIR, null, null),
                manager.getId());

        loanService.returnLoan(loan.id(), new ReturnLoanRequest(PhysicalCondition.FAIR, null), manager.getId());

        assertThat(sanctionsOf(user)).isEmpty();
    }

    @Test
    void shouldFilterLoansByUserAndStatus() {
        User user = users.create(Role.STUDENT);
        LoanResponse open = deliver(user, items.create("Libro", ItemStatus.AVAILABLE));
        LoanResponse closed = deliver(user, items.create("Libro", ItemStatus.AVAILABLE));
        loanService.returnLoan(closed.id(), new ReturnLoanRequest(PhysicalCondition.GOOD, null), manager.getId());
        clock.advance(Duration.ofHours(73));
        LoanResponse late = loanService.findById(open.id());

        var all = loanService.search(user.getId(), null, null, PageRequest.of(0, 10));
        var overdue = loanService.search(user.getId(), null, LoanStatus.OVERDUE, PageRequest.of(0, 10));
        var active = loanService.search(user.getId(), null, LoanStatus.ACTIVE, PageRequest.of(0, 10));
        var returned = loanService.search(user.getId(), null, LoanStatus.RETURNED, PageRequest.of(0, 10));

        assertThat(late.status()).isEqualTo(LoanStatus.OVERDUE);
        assertThat(all.totalElements()).isEqualTo(2);
        assertThat(overdue.content()).extracting(LoanResponse::id).containsExactly(open.id());
        assertThat(active.content()).isEmpty();
        assertThat(returned.content()).extracting(LoanResponse::id).containsExactly(closed.id());
    }

    @Test
    void shouldThrowNotFoundForUnknownLoan() {
        assertThatThrownBy(() -> loanService.findById(-1L)).isInstanceOf(NotFoundException.class);
    }

    private java.util.List<SanctionResponse> sanctionsOf(User user) {
        return sanctionService.findByUser(user.getId(), null, PageRequest.of(0, 10)).content();
    }
}
